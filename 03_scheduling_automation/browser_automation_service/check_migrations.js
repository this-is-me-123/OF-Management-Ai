const Database = require('better-sqlite3');
const dbPath = './backend/logs.db'; // Relative path from project root

let db;
try {
  db = new Database(dbPath, { readonly: true });
  console.log('Connected to', dbPath);
  const rows = db.prepare('SELECT filename, applied_at FROM schema_migrations').all();
  if (rows.length > 0) {
    console.log('Applied migrations:');
    rows.forEach(row => {
      console.log(`- ${row.filename} (applied at ${row.applied_at})`);
    });
  } else {
    console.log('No migrations found in schema_migrations table.');
  }
} catch (error) {
  console.error('Error querying migrations:', error.message);
  if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table: schema_migrations')) {
    console.error('The schema_migrations table does not exist. Migrations likely did not run or failed before creating it.');
  }
} finally {
  if (db) {
    db.close();
    console.log('Database connection closed.');
  }
}
