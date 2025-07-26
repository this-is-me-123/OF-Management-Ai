import { createDbConnection, runAsync, closeDbConnection } from "./db/db.js";

(async () => {
  const db = await createDbConnection("logs.db");
  // example: inserting seed metadata
  await runAsync(
    `INSERT INTO meta (key, value) VALUES (?, ?)`,
    ["lastSeed", new Date().toISOString()]
  );
  closeDbConnection();
  console.log("Meta seeded successfully");
})().catch(err => {
  console.error("Failed to seed meta:", err);
  process.exit(1);
});
