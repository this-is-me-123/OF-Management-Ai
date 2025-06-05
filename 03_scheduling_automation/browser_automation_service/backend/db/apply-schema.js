import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = '/app/logs.db'; // Path inside the Docker container
const migrationsDir = path.join(__dirname, 'migrations');

async function applyMigrations() {
  let db;
  try {
    db = new Database(dbPath);
    console.log('Connected to the database.');

    // 1. Ensure schema_migrations table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
    console.log('Checked/created schema_migrations table.');

    // 2. Get already applied migrations
    const appliedMigrationsRows = db.prepare('SELECT filename FROM schema_migrations').all();
    const appliedMigrations = new Set(appliedMigrationsRows.map(row => row.filename));
    console.log('Applied migrations:', Array.from(appliedMigrations));

    // 3. Read migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically (e.g., 001_..., 002_...)

    console.log('Found migration files:', migrationFiles);

    // 4. Apply pending migrations
    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) {
        console.log(`Migration ${file} already applied. Skipping.`);
        continue;
      }

      console.log(`Applying migration ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute the whole SQL file. better-sqlite3's exec handles multiple statements.
      db.exec(sql);
      
      // Record migration as applied
      const stmt = db.prepare('INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)');
      stmt.run(file, new Date().toISOString());
      console.log(`Migration ${file} applied successfully and recorded.`);
    }

    // --- Add default test user if it doesn't exist ---
    console.log('Checking for default test user (test@example.com)...');
    const testUserEmail = 'test@example.com';
    const testUserPassword = 'password123';
    let existingTestUser = db.prepare('SELECT id FROM users WHERE email = ?').get(testUserEmail);

    if (!existingTestUser) {
      console.log(`Default test user ${testUserEmail} not found. Creating...`);
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(testUserPassword, saltRounds);
      const userId = uuidv4();
      const now = new Date().toISOString();
      db.prepare(
        'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
      ).run(userId, testUserEmail, passwordHash, now);
      console.log(`Default test user ${testUserEmail} created successfully.`);
    } else {
      console.log(`Default test user ${testUserEmail} already exists.`);
    }
    // --- End add default test user ---

    console.log('All pending migrations applied successfully.');

  } catch (error) {
    console.error('Failed to apply migrations:', error);
    process.exit(1); // Exit with error code if migrations fail
  } finally {
    if (db) {
      db.close();
      console.log('Database connection closed.');
    }
  }
}

applyMigrations();

