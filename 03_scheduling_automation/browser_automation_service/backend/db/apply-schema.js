import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  createDbConnection,
  runAsync,
  allAsync,
  getAsync,
  closeDbConnection
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'logs.db');
const migrationsDir = path.join(__dirname, 'migrations');

async function applyMigrations() {
  let db;
  try {
    // Use SQL.js for portability
    db = await createDbConnection(dbPath);
    console.log('Connected to the database.');

    // 1. Ensure schema_migrations table exists
    runAsync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
    console.log('Checked/created schema_migrations table.');

    // 2. Get already applied migrations
    const appliedMigrationsRows = allAsync('SELECT filename FROM schema_migrations');
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
      
      // Execute the entire SQL file with sql.js
      runAsync(sql);
      
      // Record migration as applied
      runAsync('INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)', [file, new Date().toISOString()]);
      console.log(`Migration ${file} applied successfully and recorded.`);
    }

    // --- Add default test user if it doesn't exist ---
    console.log('Checking for default test user (test@example.com)...');
    const testUserEmail = 'test@example.com';
    const testUserPassword = 'password123';
    let existingTestUser = getAsync('SELECT id FROM users WHERE email = ?', [testUserEmail]);

    if (!existingTestUser) {
      console.log(`Default test user ${testUserEmail} not found. Creating...`);
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(testUserPassword, saltRounds);
      const userId = uuidv4();
      const now = new Date().toISOString();
      runAsync(
        'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
        [userId, testUserEmail, passwordHash, now]
      );
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
      closeDbConnection();
      console.log('Database connection closed.');
    }
  }
}

applyMigrations();

