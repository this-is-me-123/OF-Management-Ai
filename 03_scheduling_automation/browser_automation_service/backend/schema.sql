CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder TEXT UNIQUE NOT NULL,
  timestamp TEXT,
  status TEXT,
  finalUrl TEXT,
  error TEXT,
  captchaDetected INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL,
  updated_at TEXT,
  result TEXT,
  error TEXT
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL,
  run_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS schema_version (version INTEGER);
INSERT OR REPLACE INTO schema_version(rowid, version) VALUES (1, 1);
