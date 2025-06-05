// Logging setup (Winston or similar)
module.exports = {
  info: (msg) => console.log('[INFO]', msg),
  error: (msg) => console.error('[ERROR]', msg)
};
