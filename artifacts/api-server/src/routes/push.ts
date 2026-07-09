import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { eq, sql, or, isNull } from "drizzle-orm";
import { db, pushTokensTable, notificationPrefsTable } from "@workspace/db";
import { z } from "zod";
import { requireAdmin, readUserSession } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── In-memory rate limiters for public push endpoints ───────────────────────
// /push/register inserts into the DB; must be throttled to prevent flooding.
// /push/unregister deletes rows; throttled to prevent enumeration/mass-wipe.
// req.ip is reliable because app.ts sets `trust proxy: 1`.
const MINUTE = 60_000;
const TEN_MIN = 10 * MINUTE;
const MAX_REGISTER_PER_IP_TEN_MIN = 10;
const MAX_REGISTER_GLOBAL_PER_MINUTE = 50;
const MAX_UNREGISTER_PER_IP_TEN_MIN = 20;
const MAX_UNREGISTER_GLOBAL_PER_MINUTE = 100;

type Bucket = number[];
const regIpBuckets = new Map<string, Bucket>();
const regGlobalBucket: Bucket = [];
const unregIpBuckets = new Map<string, Bucket>();
const unregGlobalBucket: Bucket = [];

function pruneAndPush(
  map: Map<string, Bucket>,
  ip: string,
  windowMs: number,
  now: number,
): Bucket {
  let b = map.get(ip);
  if (!b) {
    b = [];
    map.set(ip, b);
  }
  const cutoff = now - windowMs;
  while (b.length && b[0]! < cutoff) b.shift();
  return b;
}

function makeRateLimit(
  ipBuckets: Map<string, Bucket>,
  globalBucket: Bucket,
  maxPerIp: number,
  maxGlobal: number,
) {
  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const ip = req.ip || "unknown";
    const now = Date.now();

    const globalCutoff = now - MINUTE;
    while (globalBucket.length && globalBucket[0]! < globalCutoff)
      globalBucket.shift();
    if (globalBucket.length >= maxGlobal) {
      res.status(429).json({ ok: false, error: "Too many requests" });
      return;
    }

    const ipBucket = pruneAndPush(ipBuckets, ip, TEN_MIN, now);
    if (ipBucket.length >= maxPerIp) {
      res.status(429).json({ ok: false, error: "Too many requests" });
      return;
    }

    ipBucket.push(now);
    globalBucket.push(now);
    next();
  };
}

const rateLimitRegister = makeRateLimit(
  regIpBuckets,
  regGlobalBucket,
  MAX_REGISTER_PER_IP_TEN_MIN,
  MAX_REGISTER_GLOBAL_PER_MINUTE,
);

const rateLimitUnregister = makeRateLimit(
  unregIpBuckets,
  unregGlobalBucket,
  MAX_UNREGISTER_PER_IP_TEN_MIN,
  MAX_UNREGISTER_GLOBAL_PER_MINUTE,
);

// Periodic cleanup to prevent unbounded map growth under sustained attack.
setInterval(() => {
  const now = Date.now();
  for (const map of [regIpBuckets, unregIpBuckets]) {
    for (const [ip, b] of map) {
      const cutoff = now - TEN_MIN;
      while (b.length && b[0]! < cutoff) b.shift();
      if (!b.length) map.delete(ip);
    }
  }
}, 5 * MINUTE).unref();

// ─────────────────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  token: z.string().min(10).max(400),
  platform: z.enum(["ios", "android", "web"]),
});

router.post("/push/register", rateLimitRegister, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  const { token, platform } = parsed.data;
  const session = readUserSession(req);
  try {
    await db
      .insert(pushTokensTable)
      .values({ token, platform, userId: session?.userId ?? null })
      .onConflictDoUpdate({
        target: pushTokensTable.token,
        set: {
          platform,
          userId: session?.userId ?? null,
          lastSeenAt: sql`now()`,
        },
      });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "push/register failed");
    res.status(500).json({ error: "server" });
  }
});

router.post("/push/unregister", rateLimitUnregister, async (req, res) => {
  const t = String(req.body?.token ?? "");
  if (!t) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  const session = readUserSession(req);
  try {
    // Ownership check: only allow unregistering a token if it was registered
    // anonymously (userId IS NULL) or belongs to the currently logged-in user.
    // This prevents a logged-out caller from wiping another user's token.
    const [row] = await db
      .select({ userId: pushTokensTable.userId })
      .from(pushTokensTable)
      .where(eq(pushTokensTable.token, t))
      .limit(1);

    if (row) {
      const tokenOwner = row.userId;
      const callerId = session?.userId ?? null;
      if (tokenOwner !== null && tokenOwner !== callerId) {
        res.status(403).json({ error: "forbidden" });
        return;
      }
    }

    await db.delete(pushTokensTable).where(eq(pushTokensTable.token, t));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "push/unregister failed");
    res.status(500).json({ error: "server" });
  }
});

const broadcastSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  url: z.string().trim().max(400).optional(),
});

export interface ExpoPushMessage {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendExpoBatch(messages: ExpoPushMessage[]): Promise<{ ok: number; fail: number }> {
  if (messages.length === 0) return { ok: 0, fail: 0 };
  let ok = 0;
  let fail = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const r = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      });
      if (r.ok) {
        const j = (await r.json()) as { data?: Array<{ status: string }> };
        for (const item of j.data ?? []) {
          if (item.status === "ok") ok++;
          else fail++;
        }
      } else {
        fail += chunk.length;
      }
    } catch {
      fail += chunk.length;
    }
  }
  return { ok, fail };
}

router.post("/admin/push/broadcast", requireAdmin, async (req: Request, res) => {
  const parsed = broadcastSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  const { title, body, url } = parsed.data;
  try {
    // Skip tokens whose owner turned push off. Anonymous tokens (no userId) and
    // users without a prefs row keep the default-on behaviour (LEFT JOIN → null).
    const rows = await db
      .select({ token: pushTokensTable.token })
      .from(pushTokensTable)
      .leftJoin(
        notificationPrefsTable,
        eq(notificationPrefsTable.userId, pushTokensTable.userId),
      )
      .where(
        or(
          isNull(notificationPrefsTable.userId),
          eq(notificationPrefsTable.pushEnabled, true),
        ),
      );
    const messages: ExpoPushMessage[] = rows
      .filter((r) => r.token.startsWith("ExponentPushToken[") || r.token.startsWith("ExpoPushToken["))
      .map((r) => ({
        to: r.token,
        sound: "default" as const,
        title,
        body,
        data: url ? { url } : undefined,
      }));
    const result = await sendExpoBatch(messages);
    res.json({ ok: true, sent: result.ok, failed: result.fail, total: messages.length });
  } catch (err) {
    logger.error({ err }, "push/broadcast failed");
    res.status(500).json({ error: "server" });
  }
});

router.get("/admin/push/stats", requireAdmin, async (_req, res) => {
  try {
    const [r] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(pushTokensTable);
    res.json({ tokens: r?.total ?? 0 });
  } catch {
    res.status(500).json({ error: "server" });
  }
});

export default router;
