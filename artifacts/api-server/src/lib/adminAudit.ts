import type { Request, Response, NextFunction } from "express";
import { writeAudit, auditActor } from "./audit";

// ─── Comprehensive admin-mutation audit ───────────────────────────────────────
// A single safety-net so EVERY admin write is recorded (who/what/when), even on
// routes that don't emit their own detailed audit. It logs the METHOD + PATH +
// actor + affected id — NEVER the request body — so no sensitive field value is
// ever written to the audit trail. Richer, entity-specific audits (e.g. which
// roster fields changed) still fire in their handlers; this is the complete trail
// underneath them. Mounted right after adminGate, so req.admin is already resolved.

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
// login/logout have their own flow and no mutation target; skip to avoid noise.
const SKIP_SEGMENTS = new Set(["login", "logout"]);

export function adminMutationAudit(req: Request, res: Response, next: NextFunction): void {
  const m = req.path.match(/^\/admin\/([a-z0-9-]+)(?:\/([0-9]+))?/);
  if (!m || READ_METHODS.has(req.method) || SKIP_SEGMENTS.has(m[1])) {
    next();
    return;
  }
  const segment = m[1];
  const idPart = m[2];
  const method = req.method;
  const path = req.path;
  // Log only once the response is sent, and only if the mutation SUCCEEDED — a
  // 4xx (validation/permission/CSRF) is not a change worth recording as done.
  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    void writeAudit({
      actor: auditActor(req),
      action: `admin_${method.toLowerCase()}`,
      targetType: segment,
      targetId: idPart ? Number(idPart) : undefined,
      newValue: `${method} ${path}`, // route only — never the request body
    });
  });
  next();
}
