import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as edSign,
  type KeyObject,
} from "node:crypto";
import { db, attestationsTable, type Attestation } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { logger } from "./logger";

// ============================================================================
// الشرف القابل للتحقّق — Verifiable Honesty
//
// Every public number Island Haven shows is sealed into a signed, hash-chained
// attestation. The visitor re-computes the hash and verifies the Ed25519
// signature IN THEIR OWN BROWSER against our PUBLISHED public key — a pass is
// math they computed, not a claim we made. "لا تثق بنا — تحقّق منّا."
//
// Signing side (this file): zero external dependency — Node's built-in
// `node:crypto` Ed25519 (RFC 8032). The browser verifies with a vendored copy
// of @noble/ed25519; both are standard Ed25519, so a signature made here
// verifies there. That interop is proven by test (see test/attest.mjs).
// ============================================================================

// ----------------------------------------------------------------------------
// Canonical JSON — MUST stay byte-identical to the browser's canonicalize()
// (artifacts/ih-haven/src/lib/attest-verify.ts). Sort keys at every depth,
// reject non-finite numbers, JSON.stringify for stable escaping. This is a
// security primitive, kept as a small self-contained function we can audit.
// ----------------------------------------------------------------------------
export function canonicalize(value: unknown): string {
  return JSON.stringify(canonicalSort(value));
}
function canonicalSort(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("canonicalize: non-finite numbers have no canonical form");
    }
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalSort);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) out[k] = canonicalSort(obj[k]);
  return out;
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256")
    .update(typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data))
    .digest("hex");
}

export const GENESIS_HASH = "0".repeat(64);

// ----------------------------------------------------------------------------
// The signed body. `hash = sha256(canonicalize(body))`; the signature is over
// the raw 32 hash bytes. The browser is handed `payload` verbatim and re-hashes
// exactly this, so there is no reconstruction drift.
// ----------------------------------------------------------------------------
export interface AttestationBody {
  seq: number;
  issuedAt: string; // ISO 8601
  numbers: Record<string, number>;
  prevHash: string;
}

// ----------------------------------------------------------------------------
// Ed25519 key handling (node:crypto).
//
// The private key is a 32-byte seed, stored as hex in IH_ATTEST_PRIVATE_KEY_HEX
// — the SAME representation @noble/ed25519 uses, so server signatures verify in
// the browser. We wrap the seed in the fixed Ed25519 PKCS#8 prefix to build a
// KeyObject; the public key is derived from it.
//
// Prod: refuse to run without a real key (never serve an unsigned "proof").
// Dev:  derive a stable seed from SESSION_SECRET so local runs have a
//       consistent chain without a committed key.
// ----------------------------------------------------------------------------
const PKCS8_ED25519_PREFIX = Buffer.from(
  "302e020100300506032b657004220420",
  "hex",
); // ASN.1 wrapper: PKCS#8 PrivateKeyInfo header for a 32-byte Ed25519 seed.

function privateKeyFromSeedHex(seedHex: string): KeyObject {
  const seed = Buffer.from(seedHex, "hex");
  if (seed.length !== 32) {
    throw new Error(`IH_ATTEST_PRIVATE_KEY_HEX must be 32 bytes (64 hex chars); got ${seed.length}`);
  }
  return createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, seed]),
    format: "der",
    type: "pkcs8",
  });
}

function publicKeyHexOf(priv: KeyObject): string {
  const spki = createPublicKey(priv).export({ type: "spki", format: "der" });
  // Raw Ed25519 public key = the trailing 32 bytes of the SPKI DER.
  return Buffer.from(spki.subarray(spki.length - 32)).toString("hex");
}

interface SigningKey {
  priv: KeyObject;
  publicKeyHex: string;
  keyId: string;
}

let cachedKey: SigningKey | null = null;

function resolveSeedHex(): string {
  const fromEnv = (process.env.IH_ATTEST_PRIVATE_KEY_HEX ?? "").trim().toLowerCase();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "IH_ATTEST_PRIVATE_KEY_HEX is required in production — refusing to sign attestations without a managed key.",
    );
  }
  // Dev fallback: a stable per-install seed derived from SESSION_SECRET (never
  // committed, stable across restarts). Real deploys set the env explicitly.
  const secret = process.env.SESSION_SECRET ?? "ih-attest-dev-secret";
  const seed = sha256Hex(`ih-attest-dev-seed:v1:${secret}`);
  logger.warn(
    "[attest] IH_ATTEST_PRIVATE_KEY_HEX unset — using a SESSION_SECRET-derived dev key. Set a managed key for production.",
  );
  return seed; // 64 hex chars = 32 bytes.
}

function getKey(): SigningKey {
  if (cachedKey) return cachedKey;
  const priv = privateKeyFromSeedHex(resolveSeedHex());
  const publicKeyHex = publicKeyHexOf(priv);
  // A short, stable id derived from the public key so a published key can be
  // matched to the attestations it signed (and rotated later).
  const keyId = `ih-ed25519-${sha256Hex(publicKeyHex).slice(0, 12)}`;
  cachedKey = { priv, publicKeyHex, keyId };
  return cachedKey;
}

/** Public key material to publish (public half only — never the seed). */
export function publicKeyInfo(): {
  id: string;
  algorithm: string;
  publicKeyHex: string;
  status: string;
} {
  const { publicKeyHex, keyId } = getKey();
  return { id: keyId, algorithm: "ed25519", publicKeyHex, status: "active" };
}

/** Sign the raw bytes of a hex hash → signature hex. */
function signHashHex(hashHex: string): string {
  const { priv } = getKey();
  return Buffer.from(edSign(null, Buffer.from(hashHex, "hex"), priv)).toString("hex");
}

/** Server-side self-check (belt-and-suspenders; the real verification is the browser's). */
export function hashOf(body: AttestationBody): string {
  return sha256Hex(canonicalize(body));
}

// ----------------------------------------------------------------------------
// The honest, canonical number set. Real DB counts only — NO `numbers_base`
// offset (that admin-tunable inflation is the one figure we refuse to sign),
// and NO volatile live-presence count. `members` here is the honest community
// total (active, non-expert), matching /api/members' communityTotal — not the
// offset-adjusted /api/numbers.members.
// ----------------------------------------------------------------------------
type Executor = Pick<typeof db, "execute">;

export async function computeNumbers(exec: Executor = db): Promise<Record<string, number>> {
  const res = (await exec.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE status = 'active' AND role <> 'expert') AS members,
      (SELECT COUNT(*)::int FROM users WHERE status = 'active' AND role = 'freelancer') AS freelancers,
      (SELECT COUNT(*)::int FROM users WHERE status = 'active' AND role = 'graduate') AS graduates,
      (SELECT COUNT(*)::int FROM users WHERE status = 'active' AND role = 'student') AS students,
      (SELECT COUNT(*)::int FROM expert_profiles ep JOIN users u ON u.id = ep.user_id
         WHERE ep.status = 'active' AND u.status = 'active') AS experts,
      (SELECT COUNT(*)::int FROM works w JOIN users u ON u.id = w.user_id
         WHERE w.status IN ('visible','featured') AND u.status = 'active') AS works,
      (SELECT COUNT(*)::int FROM ventures WHERE status = 'published' AND deleted_at IS NULL) AS ventures,
      (SELECT COUNT(*)::int FROM team_members WHERE status = 'visible' AND deleted_at IS NULL) AS team,
      (SELECT COUNT(*)::int FROM courses WHERE status <> 'draft') AS courses,
      (SELECT COUNT(*)::int FROM enrollments WHERE status <> 'cancelled') AS enrollments,
      (SELECT COUNT(*)::int FROM bookings WHERE status <> 'cancelled') AS bookings,
      (SELECT COALESCE(SUM(attendees),0)::int FROM bookings WHERE status <> 'cancelled') AS seats_hosted,
      (SELECT COUNT(*)::int FROM applications) AS applications,
      (SELECT COUNT(*)::int FROM daily_posts WHERE deleted_at IS NULL) AS events
  `)) as unknown as { rows: Array<Record<string, number>> };

  const r = res.rows[0] ?? {};
  // Fixed key order for readability; canonicalization sorts anyway. Values are
  // coerced to plain finite integers so canonicalize() never sees a string/NaN.
  const int = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  };
  return {
    members: int(r.members),
    freelancers: int(r.freelancers),
    graduates: int(r.graduates),
    students: int(r.students),
    experts: int(r.experts),
    works: int(r.works),
    ventures: int(r.ventures),
    team: int(r.team),
    courses: int(r.courses),
    enrollments: int(r.enrollments),
    bookings: int(r.bookings),
    seatsHosted: int(r.seats_hosted),
    applications: int(r.applications),
    events: int(r.events),
  };
}

// ----------------------------------------------------------------------------
// Serialize an attestation row for the public API — the browser needs exactly
// { payload, hash, signature, keyId } to re-verify, plus createdAt for display.
// ----------------------------------------------------------------------------
export interface PublicAttestation {
  seq: number;
  payload: AttestationBody;
  hash: string;
  signature: string;
  keyId: string;
  createdAt: string;
}

function toPublic(row: Attestation): PublicAttestation {
  return {
    seq: row.seq,
    payload: row.payload as AttestationBody,
    hash: row.hash,
    signature: row.signature,
    keyId: row.keyId,
    createdAt: row.createdAt.toISOString(),
  };
}

async function latestRow(exec: Executor & { select: typeof db.select }): Promise<Attestation | null> {
  const [row] = await exec
    .select()
    .from(attestationsTable)
    .orderBy(desc(attestationsTable.seq))
    .limit(1);
  return row ?? null;
}

// A fixed advisory-lock key so concurrent "seal" attempts serialize (only one
// process appends at a time; the rest re-read the head).
const SEAL_LOCK_KEY = 4127732001;

/**
 * Return the current head attestation, appending a NEW one first if the live
 * numbers have changed since the last seal (or if the chain is empty). Runs
 * under a transaction-scoped advisory lock so two concurrent requests can't
 * both append. The append is the ONLY write; a steady-state read is lock →
 * compare → no-op.
 */
export async function ensureHead(): Promise<PublicAttestation> {
  const head = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${SEAL_LOCK_KEY})`);

    const prev = await latestRow(tx as unknown as Executor & { select: typeof db.select });
    const numbers = await computeNumbers(tx as unknown as Executor);

    // No change since the last seal → the existing head is still the truth.
    if (prev && canonicalize((prev.payload as AttestationBody).numbers) === canonicalize(numbers)) {
      return prev;
    }

    const seq = (prev?.seq ?? 0) + 1;
    const prevHash = prev?.hash ?? GENESIS_HASH;
    const body: AttestationBody = {
      seq,
      issuedAt: new Date().toISOString(),
      numbers,
      prevHash,
    };
    const hash = hashOf(body);
    const signature = signHashHex(hash);
    const { keyId } = getKey();

    const [inserted] = await tx
      .insert(attestationsTable)
      .values({ seq, payload: body, hash, signature, keyId })
      .returning();
    logger.info({ seq, hash: hash.slice(0, 12) }, "[attest] sealed a new attestation");
    return inserted;
  });
  return toPublic(head);
}

/** The most recent chain entries, oldest→newest is NOT guaranteed — newest first. */
export async function getChain(limit = 50): Promise<PublicAttestation[]> {
  const rows = await db
    .select()
    .from(attestationsTable)
    .orderBy(desc(attestationsTable.seq))
    .limit(Math.min(Math.max(limit, 1), 200));
  return rows.map(toPublic);
}
