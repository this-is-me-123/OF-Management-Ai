import initSqlJs from "sql.js";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Derive __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default database file path
const defaultDbFile = process.env.DB_FILE
  ? path.resolve(__dirname, process.env.DB_FILE)
  : path.resolve(__dirname, "jobs.sqlite");

let SQL;       // SQL.js module
let dbInstance;
let currentDbFile = defaultDbFile;

/**
 * Initialize and return the SQL.js Database in WASM.
 * Uses sql.js (WebAssembly) to avoid native binaries.
 * @param {string} [customPath] - Optional path to the SQLite file.
 * @returns {Promise<SQL.Database>} The database instance.
 */
export async function createDbConnection(customPath) {
  const dbFile = customPath || defaultDbFile;
  if (!SQL) {
    const locate = file => path.join(__dirname, '../node_modules/sql.js/dist', file);
    SQL = await initSqlJs({ locateFile: locate });
  }

  let filebuffer = new Uint8Array();
  if (fs.existsSync(dbFile)) {
    filebuffer = fs.readFileSync(dbFile);
  }

  dbInstance = new SQL.Database(filebuffer);
  currentDbFile = dbFile;
  return dbInstance;
}

/**
 * Persist the in-memory database back to disk.
 * @param {string} [customPath] - Optional output path.
 */
export function saveDb(customPath) {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const outFile = customPath || currentDbFile;
  fs.writeFileSync(outFile, Buffer.from(data));
}

/**
 * Close the database (noop for SQL.js but calls save).
 */
export function closeDbConnection() {
  saveDb();
  dbInstance = null;
}

/**
 * Execute a statement and return all rows.
 * @param {string} sql - SQL query.
 * @param {any[]} [params] - Parameters.
 * @returns {any[]} - Result rows.
 */
export function allAsync(sql, params = []) {
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result;
}

/**
 * Execute a statement and return single row.
 * @param {string} sql - SQL query.
 * @param {any[]} [params] - Parameters.
 * @returns {any} - A single row or undefined.
 */
export function getAsync(sql, params = []) {
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
}

/**
 * Run a statement (INSERT/UPDATE/DELETE).
 * @param {string} sql - SQL statement.
 * @param {any[]} [params] - Parameters.
 */
export function runAsync(sql, params = []) {
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDb();
}