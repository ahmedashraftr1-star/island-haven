import { pool } from "@workspace/db";
await pool.query(`
  ALTER TABLE success_stories 
  ADD COLUMN IF NOT EXISTS project_url text,
  ADD COLUMN IF NOT EXISTS submitted_by_user_id integer
`);
const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='success_stories' ORDER BY ordinal_position`);
console.log("Columns:", res.rows.map((r: {column_name: string}) => r.column_name).join(", "));
await pool.end();
