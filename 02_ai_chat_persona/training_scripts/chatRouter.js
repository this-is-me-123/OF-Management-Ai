/**
 * chatRouter.js
 *
 * Minimal generateResponse implementation for tests.
 */

async function generateResponse(text) {
  // For testing purposes, just echo a friendly reply
  return `Hey there! You said: ${text}`;
}

module.exports = { generateResponse };
