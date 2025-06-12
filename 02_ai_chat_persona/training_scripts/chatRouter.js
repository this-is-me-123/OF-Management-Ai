// Simple chat router used for tests
// Exports generateResponse which returns a friendly reply.
async function generateResponse(message) {
  return `Hey there! Thanks for reaching out: ${message}`;
}

module.exports = { generateResponse };
