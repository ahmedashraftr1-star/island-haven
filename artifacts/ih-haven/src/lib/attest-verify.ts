import * as ed from "./vendor/ed25519";

/**
 * الشرف القابل للتحقّق — Verifiable Honesty, the browser side.
 *
 * The ONE source of truth for verifying Island Haven's signed public numbers,
 * entirely in the visitor's browser. Nothing here trusts a server verdict: it
 * re-canonicalizes the sealed body, recomputes the SHA-256 hash, and verifies
 * the Ed25519 signature against our PUBLISHED public key. A passing result is
 * math the visitor computed — not a claim we made. "لا تثق بنا — تحقّق منّا."
 *
 * Signature verification prefers native WebCrypto Ed25519 (Chrome ≥137,
 * Safari ≥17, Firefox ≥129) and falls back to a vendored @noble/ed25519 on
 * everything else — so it works on the older, low-end devices this is for.
 */

// ---- Data types live in the crypto-FREE sibling; re-exported here (type-only,
// erased at build) so existing importers of attest-verify keep working without
// creating a runtime edge back to this noble-importing module. ----------------
import type { AttestationBody, PublicAttestation, PublicKey } from "./attest-fetch";
export type { AttestationBody, PublicAttestation, PublicKey };

export type VerifyMethod = "webcrypto" | "noble";

export interface VerifyResult {
  valid: boolean;
  hashOk: boolean;
  sigOk: boolean;
  keyOk: boolean;
  recomputedHash: string;
  method: VerifyMethod;
  /** Present only on failure, for display. */
  reason?: string;
}

// ---- Canonical JSON — MUST match the server's canonicalize() byte-for-byte ---
// (artifacts/api-server/src/lib/attest.ts). Sort keys at every depth, reject
// non-finite numbers, JSON.stringify for deterministic escaping.
export function canonicalize(value: unknown): string {
  return JSON.stringify(canonicalSort(value));
}
function canonicalSort(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non-finite number cannot be canonicalized");
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalSort);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) out[k] = canonicalSort(obj[k]);
  return out;
}

// ---- Primitives -------------------------------------------------------------
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.toLowerCase();
  if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error(`invalid hex (length=${clean.length})`);
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Browser-native SHA-256 → hex, over UTF-8 bytes of the canonical string. */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Remember which path worked so the UI can show it honestly ("verified natively"
// vs "verified with the bundled verifier"), and skip the failing probe next time.
let preferNative: boolean | null = null;

/**
 * Verify an Ed25519 signature over `msg` with `pub`. Tries native WebCrypto
 * first; on any unsupported/throw path, falls back to vendored noble (which
 * only needs crypto.subtle SHA-512, supported for a decade). Returns the boolean
 * result plus which method produced it.
 */
export async function verifyEd25519(
  sigHex: string,
  msgHex: string,
  pubHex: string,
): Promise<{ ok: boolean; method: VerifyMethod }> {
  const sig = hexToBytes(sigHex);
  const msg = hexToBytes(msgHex);
  const pub = hexToBytes(pubHex);

  if (preferNative !== false) {
    try {
      // WebCrypto wants ArrayBuffer-backed views; hand it fresh copies so the
      // (possibly SharedArrayBuffer-typed) Uint8Arrays are never an issue.
      const buf = (u: Uint8Array): ArrayBuffer => {
        const b = new ArrayBuffer(u.byteLength);
        new Uint8Array(b).set(u);
        return b;
      };
      const key = await crypto.subtle.importKey("raw", buf(pub), { name: "Ed25519" }, false, ["verify"]);
      const ok = await crypto.subtle.verify({ name: "Ed25519" }, key, buf(sig), buf(msg));
      preferNative = true;
      return { ok, method: "webcrypto" };
    } catch {
      // Native Ed25519 unsupported on this browser → use the vendored verifier.
      preferNative = false;
    }
  }
  const ok = await ed.verifyAsync(sig, msg, pub);
  return { ok, method: "noble" };
}

// ---- The two public checks --------------------------------------------------

/**
 * Verify ONE attestation, fully locally. Recomputes the hash from the sealed
 * body, matches the signing key, and checks the Ed25519 signature. Never throws
 * for a normal "invalid" outcome — only for malformed hex / missing material.
 */
export async function verifyAttestation(
  att: PublicAttestation,
  keys: PublicKey[],
): Promise<VerifyResult> {
  const key = keys.find((k) => k.id === att.keyId);
  if (!key) {
    return {
      valid: false, hashOk: false, sigOk: false, keyOk: false,
      recomputedHash: "", method: "noble",
      reason: "no matching published key",
    };
  }
  const recomputedHash = await sha256Hex(canonicalize(att.payload));
  const hashOk = recomputedHash === att.hash;
  if (!hashOk) {
    return {
      valid: false, hashOk, sigOk: false, keyOk: true, recomputedHash, method: "noble",
      reason: "hash mismatch — a sealed number was altered",
    };
  }
  const { ok: sigOk, method } = await verifyEd25519(att.signature, att.hash, key.publicKeyHex);
  return {
    valid: hashOk && sigOk,
    hashOk, sigOk, keyOk: true, recomputedHash, method,
    reason: sigOk ? undefined : "signature does not match our public key",
  };
}

export interface ChainResult {
  valid: boolean;
  /** Per-attestation results, newest first (same order as input). */
  items: Array<VerifyResult & { seq: number }>;
  /** True if every prevHash links to the previous entry's hash. */
  linksOk: boolean;
  reason?: string;
}

/**
 * Verify a whole chain (newest-first, as the API returns it): every entry's
 * signature is valid AND every entry's prevHash equals the previous (older)
 * entry's hash — so no row can be silently rewritten or removed. The genesis
 * entry's prevHash must be 64 zeros.
 */
export async function verifyChain(
  attestations: PublicAttestation[],
  keys: PublicKey[],
): Promise<ChainResult> {
  const items = await Promise.all(
    attestations.map(async (att) => ({ seq: att.seq, ...(await verifyAttestation(att, keys)) })),
  );

  // Walk oldest→newest so each entry's prevHash can be checked against the one
  // before it. `attestations` is newest-first, so iterate in reverse.
  let linksOk = true;
  const ordered = [...attestations].reverse();
  const GENESIS = "0".repeat(64);
  for (let i = 0; i < ordered.length; i++) {
    const expectedPrev = i === 0 ? GENESIS : ordered[i - 1].hash;
    // Only enforce the genesis rule when we actually hold the first entry
    // (seq === 1); a windowed chain (limit) legitimately starts mid-stream.
    if (i === 0 && ordered[i].seq !== 1) continue;
    if (ordered[i].payload.prevHash !== expectedPrev) {
      linksOk = false;
      break;
    }
  }

  const allSigOk = items.every((r) => r.valid);
  return {
    valid: allSigOk && linksOk,
    items,
    linksOk,
    reason: !allSigOk
      ? "a signature failed"
      : !linksOk
        ? "the chain link is broken"
        : undefined,
  };
}

// (Fetchers moved to the crypto-free `attest-fetch.ts` so the eager homepage
//  graph never pulls noble into the main bundle.)
