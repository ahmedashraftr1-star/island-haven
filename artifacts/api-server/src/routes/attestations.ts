import { Router, type IRouter } from "express";
import { ensureHead, getChain, publicKeyInfo } from "../lib/attest";
import { logger } from "../lib/logger";
import { fail } from "../lib/apiError";

// الشرف القابل للتحقّق — public endpoints for the Verifiable Honesty feature.
// All public, read-only; the only write is the rare seal-on-change inside
// ensureHead() (guarded by an advisory lock). Nothing here trusts the client,
// and the browser trusts nothing here — it re-verifies the signature itself.
const router: IRouter = Router();

/**
 * GET /api/attestations/latest — the current signed head. Seals a NEW attestation
 * first iff the live numbers changed since the last seal, so the head always
 * reflects the truth right now. Returns the attestation + the published public
 * key so the visitor's browser can verify with zero trust in this server.
 */
router.get("/attestations/latest", async (_req, res) => {
  try {
    const attestation = await ensureHead();
    res.json({ attestation, publicKey: publicKeyInfo() });
  } catch (err) {
    logger.error({ err }, "GET /attestations/latest failed");
    fail(res, 500, "تعذّر تحميل الختم");
  }
});

/**
 * GET /api/attestations/chain?limit=50 — recent chain entries, newest first, for
 * the tamper-evident timeline and full independent chain verification (each
 * row's prevHash must equal the previous row's hash).
 */
router.get("/attestations/chain", async (req, res) => {
  try {
    const raw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(raw) ? raw : 50;
    await ensureHead(); // keep the head current before serving history
    const attestations = await getChain(limit);
    res.json({ attestations, publicKey: publicKeyInfo() });
  } catch (err) {
    logger.error({ err }, "GET /attestations/chain failed");
    fail(res, 500, "تعذّر تحميل السلسلة");
  }
});

/**
 * GET /api/attestations/pubkey — the published signing key(s), PUBLIC material
 * only. Mirrors /.well-known/ih-pubkey. The browser matches an attestation's
 * keyId to one of these before verifying its signature.
 */
router.get("/attestations/pubkey", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json({ keys: [publicKeyInfo()] });
});

export default router;
