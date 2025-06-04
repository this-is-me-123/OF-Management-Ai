/**
 * logger.js
 *
 * Centralized logger using console (expandable to winston or pino).
 */
module.exports = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`)
};
