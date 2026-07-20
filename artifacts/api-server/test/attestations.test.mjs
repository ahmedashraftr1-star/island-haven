// الشرف القابل للتحقّق — Verifiable Honesty endpoint tests. Runs against a LIVE
// server (default http://localhost:3001). Beyond smoke-testing the routes, these
// INDEPENDENTLY verify the served attestation the way a browser would: recompute
// the canonical SHA-256 hash and check the Ed25519 signature against the published
// public key — then prove a tampered number is rejected.
//
//   pnpm test
//
// Env: API_BASE.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";

const BASE = process.env.API_BASE ?? "http://localhost:3001/api";

async function req(path) {
  const res = await fetch(`${BASE}${path}`);
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json };
}

// canonicalize — MUST match the server + browser byte-for-byte.
function canonicalize(value) {
  return JSON.stringify(sortDeep(value));
}
function sortDeep(v) {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(sortDeep);
  const o = {};
  for (const k of Object.keys(v).sort()) o[k] = sortDeep(v[k]);
  return o;
}
const sha256Hex = (s) => createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");

// Build a node public KeyObject from a raw 32-byte Ed25519 public hex (SPKI wrap).
const SPKI_ED25519_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
function publicKeyFromHex(hex) {
  const der = Buffer.concat([SPKI_ED25519_PREFIX, Buffer.from(hex, "hex")]);
  return createPublicKey({ key: der, format: "der", type: "spki" });
}
function verifySig(pubHex, sigHex, msgHex) {
  return edVerify(null, Buffer.from(msgHex, "hex"), publicKeyFromHex(pubHex), Buffer.from(sigHex, "hex"));
}

describe("attestations — published key", () => {
  test("GET /attestations/pubkey returns an active ed25519 key", async () => {
    const r = await req("/attestations/pubkey");
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.keys) && r.json.keys.length >= 1, "keys array");
    const k = r.json.keys[0];
    assert.equal(k.algorithm, "ed25519");
    assert.equal(k.status, "active");
    assert.match(k.publicKeyHex, /^[0-9a-f]{64}$/, "32-byte public hex");
    assert.ok(k.id.startsWith("ih-ed25519-"), "stable key id");
  });
});

describe("attestations — latest is real & independently valid", () => {
  test("GET /attestations/latest verifies locally (hash + signature)", async () => {
    const r = await req("/attestations/latest");
    assert.equal(r.status, 200);
    const { attestation: a, publicKey } = r.json;
    assert.ok(a && publicKey, "attestation + publicKey present");

    // key matches
    assert.equal(a.keyId, publicKey.id, "attestation signed by the published key");

    // recompute the hash from the served payload → must equal the served hash
    const recomputed = sha256Hex(canonicalize(a.payload));
    assert.equal(recomputed, a.hash, "hash recomputes from payload");

    // verify the signature over the 32 hash bytes against the published key
    assert.equal(verifySig(publicKey.publicKeyHex, a.signature, a.hash), true, "signature verifies");

    // payload sanity: real integer numbers, monotonic seq, ISO issuedAt
    assert.equal(typeof a.payload.seq, "number");
    assert.ok(a.payload.seq >= 1);
    for (const v of Object.values(a.payload.numbers)) {
      assert.equal(Number.isInteger(v), true, "every sealed number is an integer");
    }
    assert.ok(!Number.isNaN(Date.parse(a.payload.issuedAt)), "issuedAt is a date");
  });

  test("a tampered number is rejected (signature no longer matches)", async () => {
    const r = await req("/attestations/latest");
    const { attestation: a, publicKey } = r.json;
    // inflate a number, recompute the hash the browser would compute
    const tampered = { ...a.payload, numbers: { ...a.payload.numbers } };
    const firstKey = Object.keys(tampered.numbers)[0];
    tampered.numbers[firstKey] += 1000;
    const tamperedHash = sha256Hex(canonicalize(tampered));
    assert.notEqual(tamperedHash, a.hash, "tampering changes the hash");
    // the original signature must NOT verify over the tampered hash
    assert.equal(verifySig(publicKey.publicKeyHex, a.signature, tamperedHash), false, "tamper rejected");
  });

  test("latest is stable when numbers are unchanged (no needless re-seal)", async () => {
    const a = (await req("/attestations/latest")).json.attestation;
    const b = (await req("/attestations/latest")).json.attestation;
    assert.equal(a.seq, b.seq, "same head seq");
    assert.equal(a.hash, b.hash, "same head hash");
  });
});

describe("attestations — the chain", () => {
  test("GET /attestations/chain is a hash-linked list, genesis at 64 zeros", async () => {
    const r = await req("/attestations/chain?limit=50");
    assert.equal(r.status, 200);
    const chain = r.json.attestations;
    assert.ok(Array.isArray(chain) && chain.length >= 1, "chain array");
    // newest first → oldest last. The oldest we hold, if it is seq 1, must be genesis.
    const oldest = chain[chain.length - 1];
    if (oldest.seq === 1) {
      assert.equal(oldest.payload.prevHash, "0".repeat(64), "genesis prevHash is 64 zeros");
    }
    // every link: prevHash points at the previous (older) entry's hash
    const ordered = [...chain].reverse();
    for (let i = 1; i < ordered.length; i++) {
      assert.equal(ordered[i].payload.prevHash, ordered[i - 1].hash, `link ${i} intact`);
    }
  });
});
