import {
  pgTable,
  serial,
  integer,
  jsonb,
  text,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Append-only, hash-chained public-number attestations — the storage behind the
// "الشرف القابل للتحقّق / Verifiable Honesty" feature. Each row seals the site's
// real public numbers at a point in time: the exact bytes that were signed live
// in `payload` (a canonical body { seq, issuedAt, numbers, prevHash }); `hash` is
// SHA-256 of the canonical payload; `signature` is an Ed25519 signature over those
// 32 hash bytes; `prevHash` (inside payload) links each row to the previous one so
// the timeline is tamper-evident. Insert-only: never updated or deleted in code —
// rewriting history would break the chain, which is the whole point.
//
// A new row is appended ONLY when the numbers actually change (see lib/attest.ts),
// so the chain is a meaningful record of "when the truth moved", not noise.
export const attestationsTable = pgTable(
  "attestations",
  {
    id: serial("id").primaryKey(),
    // Monotonic 1-based chain position. Kept explicit (not just the serial id) so
    // the published chain is contiguous and self-describing.
    seq: integer("seq").notNull(),
    // The EXACT canonical body that was hashed + signed: { seq, issuedAt, numbers,
    // prevHash }. Served verbatim so the browser re-hashes precisely what was
    // signed — zero reconstruction drift.
    payload: jsonb("payload").notNull(),
    // SHA-256(canonicalize(payload)) as hex.
    hash: text("hash").notNull(),
    // Ed25519 signature over the raw 32 hash bytes, as hex.
    signature: text("signature").notNull(),
    // Which published key signed this (matches /.well-known/ih-pubkey → keys[].id).
    keyId: varchar("key_id", { length: 80 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    // The chain is read newest-first (latest head) and walked by seq.
    seqIdx: uniqueIndex("attestations_seq_idx").on(t.seq),
    createdIdx: index("attestations_created_idx").on(t.createdAt),
  }),
);

export type Attestation = typeof attestationsTable.$inferSelect;
export type InsertAttestation = typeof attestationsTable.$inferInsert;
