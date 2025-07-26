CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder TEXT UNIQUE NOT NULL,
  timestamp TEXT,
  status TEXT,
  finalUrl TEXT,
  error TEXT,
  captchaDetected INTEGER DEFAULT 0
);
