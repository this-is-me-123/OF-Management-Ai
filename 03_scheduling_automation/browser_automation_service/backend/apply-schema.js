import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

(async () => {
  try {
    // Open or create the SQLite database file
    const dbPath = '/app/logs.db'; // Use absolute path
    const db = new Database(dbPath);

    // Read the schema SQL
    const schemaPath = path.resolve('db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute each statement
    for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
      db.exec(stmt);
    }

    // Verify schema version
    const row = db.prepare('SELECT version FROM schema_version').get();
    if (row && row.version === 1) {
      console.log('✅ Schema applied successfully and version 1 verified.');
    } else {
      console.error('❌ Schema applied, but version verification FAILED. Found version:', row ? row.version : 'not found');
      db.close();
      process.exit(1); // Exit with error if verification fails
    }

    db.close();
  } catch (err) {
    console.error('❌ Schema application failed:', err);
    process.exit(1);
  }
})();