-- ZAF TECH Phase 3 Data foundation
-- Apply this manually when DATABASE_URL is provisioned.
-- The application also creates this table lazily on the first persisted check.

CREATE TABLE IF NOT EXISTS zaf_app_checks (
  id BIGSERIAL PRIMARY KEY,
  app_name TEXT NOT NULL,
  url TEXT NOT NULL,
  status INTEGER,
  ok BOOLEAN NOT NULL,
  reachable BOOLEAN NOT NULL,
  response_time_ms INTEGER NOT NULL,
  https BOOLEAN NOT NULL,
  redirect BOOLEAN NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL,
  error TEXT
);

CREATE INDEX IF NOT EXISTS zaf_app_checks_url_checked_at_idx
  ON zaf_app_checks (url, checked_at DESC);
