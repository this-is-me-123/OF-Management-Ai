/**
 * persona_style.test.js
 *
 * Tests that the chat persona responds with the correct tone.
 */
const assert = require('assert');
const { generateResponse } = require('../../training_scripts/chatRouter');

describe('Chat Persona Style', () => {
  it('should use friendly tone for a greeting', async () => {
    const resp = await generateResponse('Hello!');
    assert(resp.includes('Hey there')); // example check
  });
});
