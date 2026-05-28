CREATE TABLE IF NOT EXISTS validation_jobs (
  id BIGSERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  total_records INTEGER NOT NULL DEFAULT 0,
  emails_checked INTEGER NOT NULL DEFAULT 0,
  valid_count INTEGER NOT NULL DEFAULT 0,
  invalid_count INTEGER NOT NULL DEFAULT 0,
  risky_count INTEGER NOT NULL DEFAULT 0,
  unknown_count INTEGER NOT NULL DEFAULT 0,
  disposable_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validation_results (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT REFERENCES validation_jobs(id) ON DELETE CASCADE,
  original_email TEXT NOT NULL,
  normalized_email TEXT,
  status TEXT NOT NULL,
  is_reachable TEXT,
  syntax_valid BOOLEAN,
  domain TEXT,
  mx_accepts_mail BOOLEAN,
  is_disposable BOOLEAN,
  is_role_account BOOLEAN,
  is_catch_all BOOLEAN,
  reason TEXT,
  raw_response JSONB,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_results_job_id ON validation_results(job_id);
CREATE INDEX IF NOT EXISTS idx_validation_jobs_created_at ON validation_jobs(created_at DESC);
