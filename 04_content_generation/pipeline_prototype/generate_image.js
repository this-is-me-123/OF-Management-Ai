/**
 * generate_image.js
 *
 * Example script to call Stable Diffusion API (or chosen engine) to generate an image.
 */
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

async function generate() {
  const prompt = fs.readFileSync('../prompt_templates/cover_image_prompts.md', 'utf-8').split('\n')[0];

  # Dummy API call structure; replace with actual SDK or HTTP request
  const response = await axios.post(
    'https://api.your-image-engine.com/v1/generate',
    { prompt },
    { headers: { 'Authorization': `Bearer ${process.env.IMAGE_ENGINE_API_KEY}` } }
  );

  const imageBuffer = Buffer.from(response.data.image_base64, 'base64');
  fs.writeFileSync('../assets/output_cover.png', imageBuffer);
  console.log('Generated image saved to assets/output_cover.png');
}

generate().catch(console.error);
