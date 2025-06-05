-- Initial database schema

-- jobs table: queued, running, failed, completed
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  folder TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT,
  result TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- logs table: snapshots or metadata per run
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder TEXT UNIQUE NOT NULL, -- This was in the original schema.sql, might need review if it's job_id related.
  timestamp TEXT,
  status TEXT,
  finalUrl TEXT,
  error TEXT,
  captchaDetected INTEGER DEFAULT 0
);

-- users table: for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
