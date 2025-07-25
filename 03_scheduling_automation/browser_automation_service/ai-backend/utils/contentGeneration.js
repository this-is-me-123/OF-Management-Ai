const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/lib/sync');

async function triggerContentGeneration(promptFile = "prompt_templates/cover_image_prompts.json") {
  const response = await fetch('http://127.0.0.1:5001/generate-assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt_file: promptFile })
  });
  return await response.json();
}

function getLatestAsset() {
  try {
    const manifestPath = path.join(__dirname, '../../../../../04_content_generation/assets/asset_manifest.csv');
    const csv = fs.readFileSync(manifestPath, 'utf8');
    const records = csvParse(csv, { columns: true });
    return records[records.length - 1];
  } catch (e) {
    console.error("Error reading asset manifest:", e);
    return null;
  }
}

module.exports = { triggerContentGeneration, getLatestAsset };
