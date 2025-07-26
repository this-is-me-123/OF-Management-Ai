-- backend/db/schema-jobs.sql

CREATE TABLE IF NOT EXISTS jobs (
  id          TEXT   PRIMARY KEY,
  folder      TEXT   NOT NULL,
  status      TEXT   NOT NULL,      -- queued, running, completed, failed
  created_at  TEXT   DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT,
  error       TEXT,
  result      TEXT
);
