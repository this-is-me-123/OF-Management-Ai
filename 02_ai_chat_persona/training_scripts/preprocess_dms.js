/**
 * preprocess_dms.js
 *
 * Reads raw DMs from `raw_dms.json` and outputs cleaned JSONL for fine-tuning.
 */
const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('raw_dms.json', 'utf-8'));
const cleaned = raw.map((msg) => {
  return {
    prompt: `User: ${msg.user_text}\nAssistant:`,
    completion: ` ${msg.bot_response}`
  };
});

fs.writeFileSync('cleaned_dms.jsonl', cleaned.map(JSON.stringify).join('\n'));
console.log('Preprocessing complete: cleaned_dms.jsonl created');
