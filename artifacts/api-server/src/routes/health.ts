import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Liveness — the process is up (no dependencies checked).
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Readiness — the process can serve traffic (database reachable). Returns 503
// when the DB is down so load balancers / deploy health checks can react.
router.get("/readyz", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ok", db: "up" });
  } catch (err) {
    logger.error({ err }, "readiness check failed");
    res.status(503).json({ status: "degraded", db: "down" });
  }
});

export default router;
