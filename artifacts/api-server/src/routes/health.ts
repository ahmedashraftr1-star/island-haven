import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { publicKeyInfo } from "../lib/attest";

const router: IRouter = Router();

// Liveness — the process is up (no dependencies checked).
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Readiness — the process can serve traffic. Checks the DB AND that the Ed25519
// signing key resolves, so a deploy missing IH_ATTEST_PRIVATE_KEY_HEX is caught
// here (503) instead of silently booting healthy and only 500-ing when the first
// /api/attestations/* request arrives. Returns 503 on any failed dependency so
// load balancers / deploy health checks react before traffic is sent.
router.get("/readyz", async (_req, res) => {
  let dbUp = false;
  let signingKeyUp = false;
  try {
    await db.execute(sql`SELECT 1`);
    dbUp = true;
  } catch (err) {
    logger.error({ err }, "readiness check: db down");
  }
  try {
    // Resolves + caches the key; throws in production when the seed is unset.
    publicKeyInfo();
    signingKeyUp = true;
  } catch (err) {
    logger.error({ err }, "readiness check: signing key unavailable");
  }
  const ready = dbUp && signingKeyUp;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "degraded",
    db: dbUp ? "up" : "down",
    signingKey: signingKeyUp ? "up" : "down",
  });
});

export default router;
