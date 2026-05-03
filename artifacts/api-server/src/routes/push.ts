import { Router, type IRouter, type Request } from "express";
import { eq, sql } from "drizzle-orm";
import { db, pushTokensTable } from "@workspace/db";
import { z } from "zod";
import { requireAdmin, readUserSession } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const registerSchema = z.object({
  token: z.string().min(10).max(400),
  platform: z.enum(["ios", "android", "web"]),
});

router.post("/push/register", async (req, res) => {
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

router.post("/push/unregister", async (req, res) => {
  const t = String(req.body?.token ?? "");
  if (!t) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  try {
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

interface ExpoPushMessage {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

async function sendExpoBatch(messages: ExpoPushMessage[]): Promise<{ ok: number; fail: number }> {
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
    const rows = await db.select({ token: pushTokensTable.token }).from(pushTokensTable);
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
