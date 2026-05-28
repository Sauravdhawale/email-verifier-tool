import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add it to server/.env.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

export async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
}

export async function updateJobCounts(jobId) {
  await pool.query(
    `UPDATE validation_jobs
     SET emails_checked = stats.emails_checked,
         valid_count = stats.valid_count,
         invalid_count = stats.invalid_count,
         risky_count = stats.risky_count,
         unknown_count = stats.unknown_count,
         disposable_count = stats.disposable_count,
         updated_at = NOW()
     FROM (
       SELECT
         COUNT(*)::int AS emails_checked,
         COUNT(*) FILTER (WHERE status = 'valid')::int AS valid_count,
         COUNT(*) FILTER (WHERE status = 'invalid')::int AS invalid_count,
         COUNT(*) FILTER (WHERE status = 'risky')::int AS risky_count,
         COUNT(*) FILTER (WHERE status = 'unknown')::int AS unknown_count,
         COUNT(*) FILTER (WHERE status = 'disposable')::int AS disposable_count
       FROM validation_results
       WHERE job_id = $1 AND status <> 'duplicate'
     ) stats
     WHERE validation_jobs.id = $1`,
    [jobId]
  );
}
