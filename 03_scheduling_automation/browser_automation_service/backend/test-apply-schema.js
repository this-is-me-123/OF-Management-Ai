// backend/test-apply-schema.js
import { exec } from 'child_process';

// Run apply-schema.js from this backend directory
exec('node backend/apply-schema.js', (err, stdout, stderr) => {
  if (err) {
    console.error('Script failed:', stderr);
    process.exit(1);
  }
  console.log('Apply-schema output:', stdout);

  // Verify via sqlite3 CLI:
  exec("sqlite3 logs.db \".tables\"", (err2, out2) => {
    if (err2) {
      console.error('Listing tables failed:', err2);
      process.exit(1);
    }
    console.log('Tables:', out2);
    if (out2.includes('schedules') && out2.includes('jobs')) {
      console.log('✅ Tables verified');
      process.exit(0);
    } else {
      console.error('❌ Missing expected tables');
      process.exit(1);
    }
  });
});
