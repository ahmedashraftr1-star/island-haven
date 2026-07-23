import crypto from "node:crypto";

// ─── secretbox — authenticated encryption for secrets at rest (AES-256-GCM) ────
// Used to encrypt sensitive values we must store but never want readable in a DB
// dump (currently: TOTP 2FA secrets). Format: `v1.<iv>.<tag>.<ciphertext>` (all
// base64url). `decrypt` transparently passes through any value WITHOUT the `v1.`
// prefix, so pre-existing PLAINTEXT secrets keep working and get re-encrypted on
// their next write — a zero-downtime migration.
//
// Key: prefer a dedicated SECRET_ENCRYPTION_KEY (64 hex chars = 32 bytes); else
// derive a stable 32-byte key from SESSION_SECRET (scrypt + fixed app salt). In
// production SESSION_SECRET is always present (auth.ts enforces it at boot).

const PREFIX = "v1.";
let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) return cachedKey;
  const explicit = process.env.SECRET_ENCRYPTION_KEY;
  if (explicit && /^[0-9a-fA-F]{64}$/.test(explicit)) {
    cachedKey = Buffer.from(explicit, "hex");
    return cachedKey;
  }
  const base = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!base || base.length < 8) {
    throw new Error(
      "secretbox: no encryption key. Set SECRET_ENCRYPTION_KEY (64 hex) or a SESSION_SECRET.",
    );
  }
  cachedKey = crypto.scryptSync(base, "ih-secretbox-v1", 32);
  return cachedKey;
}

/** Encrypt a UTF-8 string → `v1.<iv>.<tag>.<ct>` (base64url). */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${ct.toString("base64url")}`;
}

/**
 * Decrypt a value produced by encryptSecret. If the value lacks the `v1.` prefix
 * it is assumed to be a legacy PLAINTEXT secret and returned as-is (migration).
 * Throws only on a corrupted/tampered `v1.` value.
 */
export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext
  const [, ivB64, tagB64, ctB64] = stored.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("secretbox: malformed ciphertext");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64url")), decipher.final()]).toString("utf8");
}

/** True if the stored value is already encrypted (has the version prefix). */
export function isEncrypted(stored: string): boolean {
  return stored.startsWith(PREFIX);
}
