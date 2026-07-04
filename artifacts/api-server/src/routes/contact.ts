import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { insertContactSchema } from "@workspace/db";
import { queueEmail } from "../queues/enqueue";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── In-memory rate limiter for public POST /contact ─────────────────────────
// Per-IP: 5 / 10 min. Global: 30 / min. req.ip is trustworthy (trust proxy: 1).
const MINUTE = 60_000;
const TEN_MIN = 10 * MINUTE;
const MAX_PER_IP = Number(process.env.RATE_LIMIT_CONTACT_PER_IP ?? 5);
const MAX_GLOBAL_PER_MIN = Number(process.env.RATE_LIMIT_CONTACT_GLOBAL ?? 30);
const ipBuckets = new Map<string, number[]>();
const globalBucket: number[] = [];

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const gCut = now - MINUTE;
  while (globalBucket.length && globalBucket[0]! < gCut) globalBucket.shift();
  if (globalBucket.length >= MAX_GLOBAL_PER_MIN) {
    res.status(429).json({ ok: false, error: "حركة كثيفة الآن — حاول بعد دقيقة." });
    return;
  }
  let b = ipBuckets.get(ip);
  if (!b) {
    b = [];
    ipBuckets.set(ip, b);
  }
  const cut = now - TEN_MIN;
  while (b.length && b[0]! < cut) b.shift();
  if (b.length >= MAX_PER_IP) {
    res.status(429).json({ ok: false, error: "محاولات كثيرة — أعد المحاولة بعد قليل." });
    return;
  }
  b.push(now);
  globalBucket.push(now);
  next();
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of ipBuckets) {
    const cut = now - TEN_MIN;
    while (b.length && b[0]! < cut) b.shift();
    if (!b.length) ipBuckets.delete(ip);
  }
}, 5 * MINUTE).unref();

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c);

// POST /api/contact — validates with the SHARED insertContactSchema (same schema
// the frontend runs), then best-effort emails the team. Never stores PII beyond
// the email; returns 400 + field issues on invalid input, 200 on success.
router.post("/contact", rateLimit, async (req, res) => {
  const parsed = insertContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: "تحقّق من البيانات",
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  const d = parsed.data;
  const to = process.env.CONTACT_TO || process.env.EMAIL_FROM || "";
  if (to) {
    void queueEmail({
      to,
      subject: `[Contact] ${d.subject || d.enquiry || "message"} — ${d.name}`,
      html: `<p>${esc(d.message)}</p><hr/><p>${esc(d.name)} &lt;${esc(d.email)}&gt;${d.enquiry ? ` · ${esc(d.enquiry)}` : ""}</p>`,
    }).catch((err) => logger.error({ err }, "contact email failed"));
  }
  res.json({ ok: true });
});

export default router;
