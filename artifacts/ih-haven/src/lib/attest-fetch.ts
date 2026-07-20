import { api } from "./api";

/**
 * Crypto-FREE data types + fetchers for the Verifiable-Honesty attestations.
 *
 * This module deliberately holds NO cryptography so it can be imported by the
 * eager homepage graph (via use-public-data.ts) without pulling the vendored
 * @noble/ed25519 into the main bundle. The actual verification lives in the
 * sibling `attest-verify.ts`, which imports noble and is reached ONLY from the
 * lazy `pages/Verify.tsx` chunk.
 */

// ---- Types mirror the API (api-server/src/lib/attest.ts) ---------------------
export interface AttestationBody {
  seq: number;
  issuedAt: string;
  numbers: Record<string, number>;
  prevHash: string;
}
export interface PublicAttestation {
  seq: number;
  payload: AttestationBody;
  hash: string;
  signature: string;
  keyId: string;
  createdAt: string;
}
export interface PublicKey {
  id: string;
  algorithm: string;
  publicKeyHex: string;
  status: string;
}

// ---- Fetchers ---------------------------------------------------------------
export async function fetchLatest(): Promise<{ attestation: PublicAttestation; publicKey: PublicKey }> {
  return api<{ attestation: PublicAttestation; publicKey: PublicKey }>("/attestations/latest");
}
export async function fetchChain(limit = 50): Promise<{ attestations: PublicAttestation[]; publicKey: PublicKey }> {
  return api<{ attestations: PublicAttestation[]; publicKey: PublicKey }>(`/attestations/chain?limit=${limit}`);
}
