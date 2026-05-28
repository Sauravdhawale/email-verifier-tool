import { pool, updateJobCounts } from './db.js';
import { checkEmailWithReacher, normalizeEmail } from './reacher.js';

const delayMs = Number(process.env.VALIDATION_DELAY_MS || 500);

export function processJob(jobId, emails, duplicates) {
  setTimeout(() => runJob(jobId, emails, duplicates).catch((error) => failJob(jobId, error)), 0);
}

async function runJob(jobId, emails, duplicates) {
  await pool.query('UPDATE validation_jobs SET status = $1, updated_at = NOW() WHERE id = $2', ['processing', jobId]);

  for (const duplicate of duplicates) {
    await insertResult(jobId, {
      original_email: duplicate,
      normalized_email: normalizeEmail(duplicate),
      status: 'duplicate',
      is_reachable: 'duplicate',
      syntax_valid: true,
      domain: normalizeEmail(duplicate).split('@').pop(),
      mx_accepts_mail: null,
      is_disposable: false,
      is_role_account: false,
      is_catch_all: false,
      reason: 'Duplicate email in uploaded file',
      raw_response: { duplicate: true },
      checked_at: new Date().toISOString()
    });
  }

  for (const email of emails) {
    try {
      const result = await checkEmailWithReacher(email);
      await insertResult(jobId, result);
    } catch (error) {
      await insertResult(jobId, {
        original_email: email,
        normalized_email: normalizeEmail(email),
        status: 'unknown',
        is_reachable: 'unknown',
        syntax_valid: true,
        domain: normalizeEmail(email).split('@').pop(),
        mx_accepts_mail: null,
        is_disposable: false,
        is_role_account: false,
        is_catch_all: false,
        reason: error.message || 'Unknown SMTP response',
        raw_response: { error: error.message },
        checked_at: new Date().toISOString()
      });
    }
    await updateJobCounts(jobId);
    await sleep(delayMs);
  }

  await updateJobCounts(jobId);
  await pool.query('UPDATE validation_jobs SET status = $1, updated_at = NOW() WHERE id = $2', ['complete', jobId]);
}

async function insertResult(jobId, result) {
  await pool.query(
    `INSERT INTO validation_results (
      job_id, original_email, normalized_email, status, is_reachable, syntax_valid,
      domain, mx_accepts_mail, is_disposable, is_role_account, is_catch_all,
      reason, raw_response, checked_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      jobId,
      result.original_email,
      result.normalized_email,
      result.status,
      result.is_reachable,
      result.syntax_valid,
      result.domain,
      result.mx_accepts_mail,
      result.is_disposable,
      result.is_role_account,
      result.is_catch_all,
      result.reason,
      result.raw_response,
      result.checked_at
    ]
  );
}

async function failJob(jobId, error) {
  await pool.query(
    'UPDATE validation_jobs SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
    ['failed', error.message || 'Validation failed', jobId]
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
