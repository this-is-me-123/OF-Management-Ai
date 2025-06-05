import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

const db = new Database('logs.db');
const router = express.Router();

// List all schedules
router.get('/', (req, res) => {
  const rows = db.prepare(
    `SELECT * FROM schedules ORDER BY schedule_time ASC`
  ).all();
  res.json(rows);
});

// Create a new schedule
router.post('/', (req, res) => {
  const { folder, schedule_time, recurrence_rule } = req.body;
  const id = uuidv4();
  db.prepare(
    `INSERT INTO schedules (id, folder, schedule_time, recurrence_rule) VALUES (?, ?, ?, ?)`
  ).run(id, folder, schedule_time, recurrence_rule || null);
  res.status(201).json({ id, folder, schedule_time, recurrence_rule });
});

// Update (e.g. pause/resume or change time)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const fields = [];
  const values = [];
  for (const key of ['folder','schedule_time','recurrence_rule','status']) {
    if (req.body[key] != null) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(id);
  db.prepare(
    `UPDATE schedules SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(...values);
  res.json({ success: true });
});

// Delete a schedule
router.delete('/:id', (req, res) => {
  db.prepare(`DELETE FROM schedules WHERE id = ?`).run(req.params.id);
  res.status(204).end();
});

export default router;