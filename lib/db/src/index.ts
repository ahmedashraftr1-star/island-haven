import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Connection pool tuned for horizontal scaling. `max` is per-process — when
// running N API instances behind a pooler (PgBouncer), keep N×max under the
// Postgres connection ceiling. All knobs are env-overridable for production.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX ?? 20),
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS ?? 30_000),
  connectionTimeoutMillis: Number(process.env.DB_POOL_CONN_TIMEOUT_MS ?? 10_000),
});

// A pg Pool emits 'error' on an IDLE client when Postgres or the network drops
// that connection. With no listener, Node treats it as an unhandled 'error'
// event and CRASHES the whole process — taking every route down at once. Log
// and swallow: the pool discards the broken client and the next query
// transparently acquires a healthy one. (Shared lib — console, not the api logger.)
pool.on("error", (err) => {
  console.error("[db] idle pool client error (recovered):", err);
});
export const db = drizzle(pool, {
  schema,
  logger: process.env.DRIZZLE_LOG === "1",
});

export * from "./schema";
