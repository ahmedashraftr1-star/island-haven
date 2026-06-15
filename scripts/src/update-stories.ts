/**
 * Replaces placeholder success stories (pravatar.cc avatars) with
 * authentic member stories using proper avatar placeholders.
 *
 * Safe to run multiple times — truncates and re-inserts.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run update:stories
 */
import { db, successStoriesTable, pool } from "@workspace/db";
import { sql } from "drizzle-orm";
import { REAL_STORIES } from "./seed-new-tables.js";

async function main() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://ahmedashraf@localhost/ih_haven_dev";
  }
  console.log(`🔄 Updating success stories on ${process.env.DATABASE_URL}\n`);

  console.log("🧹 Clearing existing success stories...");
  await db.execute(sql`TRUNCATE success_stories RESTART IDENTITY CASCADE`);

  console.log("📖 Inserting updated stories...");
  await db.insert(successStoriesTable).values(REAL_STORIES);
  console.log(`  ✓ ${REAL_STORIES.length} stories inserted with DiceBear avatar placeholders`);

  console.log("\n✅ Stories update complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ update:stories failed:", err);
  process.exit(1);
});
