import crypto from "node:crypto";

// RFC 6238 TOTP (SHA-1, 6 digits, 30s) implemented on Node crypto — no new deps.
// Used to give staff admin accounts a second factor. Secrets are base32 strings.

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** A fresh base32 TOTP secret (default 160-bit, the RFC-recommended size). */
export function randomBase32Secret(bytes = 20): string {
  const buf = crypto.randomBytes(bytes);
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of clean) bits += B32.indexOf(c).toString(2).padStart(5, "0");
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

/** Verify a 6-digit token against the secret, allowing ±`window` 30s steps for clock skew. */
export function verifyTotp(secretB32: string, token: string, window = 1): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  let secret: Buffer;
  try {
    secret = base32Decode(secretB32);
  } catch {
    return false;
  }
  if (secret.length === 0) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  const provided = Buffer.from(token);
  for (let i = -window; i <= window; i++) {
    const expected = Buffer.from(hotp(secret, counter + i));
    if (expected.length === provided.length && crypto.timingSafeEqual(expected, provided)) return true;
  }
  return false;
}

/** otpauth:// URI for authenticator apps (manual key entry or QR). */
export function otpauthUri(secretB32: string, label: string, issuer = "Island Haven"): string {
  const l = encodeURIComponent(label);
  const iss = encodeURIComponent(issuer);
  return `otpauth://totp/${iss}:${l}?secret=${secretB32}&issuer=${iss}&algorithm=SHA1&digits=6&period=30`;
}
