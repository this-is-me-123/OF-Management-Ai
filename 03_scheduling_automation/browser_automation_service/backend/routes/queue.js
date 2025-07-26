import express from "express";
import { v4 as uuidv4 } from "uuid";
import Database from "better-sqlite3";

const router = express.Router();
const db = new Database("logs.db");

// Helper to upsert updated_at
const now = () => new Date().toISOString();

// 1. Enqueue a new job
// POST /api/queue { folder: "session-123" }
router.post("/", (req, res) => {
  const { folder } = req.body;
  if (!folder) return res.status(400).json({ error: "Missing folder" });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO jobs (id, folder, status, created_at)
    VALUES (?, ?, 'queued', ?)
  `).run(id, folder, now());

  res.status(201).json({ id, folder, status: "queued" });
});

// 2. List all jobs
// GET /api/queue
router.get("/", (req, res) => {
  const jobs = db.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all();
  res.json(jobs);
});

// 3. Get a single job
// GET /api/queue/:id
router.get("/:id", (req, res) => {
  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });
  res.json(job);
});

// 4. Retry a job
// POST /api/queue/:id/retry
router.post("/:id/retry", (req, res) => {
  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });

  db.prepare(`
    UPDATE jobs
    SET status = 'queued', updated_at = ?
    WHERE id = ?
  `).run(now(), job.id);

  res.json({ success: true, id: job.id, status: "queued" });
});

export default router;
