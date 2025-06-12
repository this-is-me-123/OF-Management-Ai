import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createDbConnection,
  runAsync,
  getAsync,
  closeDbConnection
} from './db/db.js';

(async () => {
  try {
    // Initialize SQL.js database in the current directory
    await createDbConnection(path.resolve('logs.db'));

    // Read the schema SQL
    const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute each statement
    for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
      runAsync(stmt);
    }

    // Verify schema version
    const row = getAsync('SELECT version FROM schema_version');
    if (row && row.version === 1) {
      console.log('✅ Schema applied successfully and version 1 verified.');
    } else {
      console.error(
        '❌ Schema applied, but version verification FAILED. Found version:',
        row ? row.version : 'not found'
      );
      closeDbConnection();
      process.exit(1); // Exit with error if verification fails
    }

    closeDbConnection();
  } catch (err) {
    console.error('❌ Schema application failed:', err);
    process.exit(1);
  }
})();