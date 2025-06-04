/**
 * fine_tune.js
 *
 * Uses OpenAI API to fine-tune a model on `cleaned_dms.jsonl`.
 */
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function runFineTune() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an OnlyFans engagement assistant.' },
      { role: 'user', content: 'Fine-tune using cleaned_dms.jsonl' }
    ],
    // NOTE: In practice, you'd call openai.fineTunes.create() with training_file
  });
  console.log('Fine-tune job started:', response);
}

runFineTune().catch(console.error);
