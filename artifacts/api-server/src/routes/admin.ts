import { Router, type IRouter } from "express";
import {
  checkPassword,
  clearSessionCookie,
  makeSessionToken,
  requireAdmin,
  setSessionCookie,
  verifySessionToken,
} from "../lib/auth";

const router: IRouter = Router();

router.post("/admin/login", (req, res) => {
  const password = String(req.body?.password ?? "");
  if (!checkPassword(password)) {
    res.status(401).json({ ok: false, error: "كلمة السرّ غير صحيحة" });
    return;
  }
  const token = makeSessionToken();
  setSessionCookie(res, token);
  res.json({ ok: true, token });
});

router.post("/admin/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/admin/me", (req, res) => {
  const token = req.cookies?.["ih_admin"];
  res.json({ authenticated: verifySessionToken(token) });
});

router.get("/admin/ping", requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

export default router;
