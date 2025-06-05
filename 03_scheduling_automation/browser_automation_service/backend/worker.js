import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve('logs.db'));
const POLL_INTERVAL = 5000; // ms

async function processJob(job) {
  const now = new Date().toISOString();
  try {
    db.prepare("UPDATE jobs SET status='running', updated_at=? WHERE id=?").run(now, job.id);

    // TODO: Add your Puppeteer logic here
    const result = {};

    db.prepare(
      "UPDATE jobs SET status='completed', result=?, updated_at=? WHERE id=?"
    ).run(JSON.stringify(result), new Date().toISOString(), job.id);
    console.log(`✅ Job ${job.id} completed`);
  } catch (err) {
    db.prepare(
      "UPDATE jobs SET status='failed', error=?, updated_at=? WHERE id=?"
    ).run(err.message, new Date().toISOString(), job.id);
    console.error(`❌ Job ${job.id} failed:`, err.message);
  }
}

function poll() {
  const job = db
    .prepare("SELECT * FROM jobs WHERE status='queued' ORDER BY created_at ASC LIMIT 1")
    .get();
  if (job) {
    console.log(`🔄 Processing job ${job.id}`);
    processJob(job);
  }
}

console.log(`🕒 Worker started—polling every ${POLL_INTERVAL/1000}s`);
setInterval(poll, POLL_INTERVAL);