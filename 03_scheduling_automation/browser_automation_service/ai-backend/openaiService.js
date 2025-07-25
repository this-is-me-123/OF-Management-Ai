const axios = require('axios');

const OPENAI_CHAT_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_IMAGE_API_URL = 'https://api.openai.com/v1/images/generations';
const DEFAULT_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo';
const DEFAULT_IMAGE_MODEL = 'dall-e-3'; // Or 'dall-e-2' if preferred

/**
 * Retrieves the OpenAI API key from environment variables.
 * @returns {string|null} The API key or null if not set.
 */
function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[OpenAIService] OPENAI_API_KEY is not set.');
  }
  return apiKey;
}

/**
 * Generates a chat completion using OpenAI's API.
 * @param {Array<object>} messages - Array of message objects (e.g., [{ role: 'user', content: 'Hello' }]).
 * @param {string} [model=DEFAULT_CHAT_MODEL] - The model to use (e.g., 'gpt-4', 'gpt-3.5-turbo').
 * @returns {Promise<string|null>} The AI's reply text or null if an error occurred.
 */
async function generateChatCompletion(messages, model = DEFAULT_CHAT_MODEL) {
  const apiKey = getApiKey();
  if (!apiKey) return 'Error: OpenAI API key not configured.';

  try {
    const response = await axios.post(
      OPENAI_CHAT_API_URL,
      {
        model: model,
        messages: messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiReply = response.data.choices[0].message.content.trim();
      console.log('[OpenAIService - Chat] AI Reply:', aiReply);
      return aiReply;
    } else {
      console.error('[OpenAIService - Chat] No reply in OpenAI response:', response.data);
      return 'Sorry, I could not generate a chat reply at this moment.';
    }
  } catch (error) {
    if (error.response) {
      // Log full error from OpenAI
      console.error('[OpenAIService] Error calling OpenAI API:', error.response.status, error.response.data);
      return `Error: OpenAI API error (${error.response.status}): ${JSON.stringify(error.response.data)}`;
    } else {
      console.error('[OpenAIService] Error during chat completion:', error.message);
      return `Error: ${error.message}`;
    }
  }
}

/**
 * Generates an image using OpenAI's DALL-E API.
 * @param {string} prompt - The text prompt for image generation.
 * @param {number} [n=1] - The number of images to generate (1-10 for DALL-E 2, 1 for DALL-E 3).
 * @param {string} [size='1024x1024'] - The size of the generated images. 
 *                                      DALL-E 2: '256x256', '512x512', or '1024x1024'.
 *                                      DALL-E 3: '1024x1024', '1792x1024', or '1024x1792'.
 * @param {string} [quality='standard'] - For DALL-E 3: 'standard' or 'hd'.
 * @param {string} [style='vivid'] - For DALL-E 3: 'vivid' or 'natural'.
 * @param {string} [model=DEFAULT_IMAGE_MODEL] - The DALL-E model to use.
 * @returns {Promise<Array<object>|null>} An array of image objects (each with a URL) or null if an error occurred.
 */
async function generateImage(prompt, { n = 1, size = '1024x1024', quality = 'standard', style = 'vivid', model = DEFAULT_IMAGE_MODEL } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const payload = {
    model: model,
    prompt: prompt,
    n: model === 'dall-e-3' ? 1 : n, // DALL-E 3 currently supports n=1
    size: size,
  };

  if (model === 'dall-e-3') {
    payload.quality = quality;
    payload.style = style;
  }

  try {
    const response = await axios.post(OPENAI_IMAGE_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      console.log('[OpenAIService - Image] Images generated successfully.');
      return response.data.data; // Array of image objects, each containing a URL
    } else {
      console.error('[OpenAIService - Image] No image data in OpenAI response:', response.data);
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('[OpenAIService - Image] Error calling OpenAI Image API:', error.response.status, error.response.data);
    } else {
      console.error('[OpenAIService - Image] Error setting up OpenAI Image request:', error.message);
    }
    return null;
  }
}

module.exports = {
  generateChatCompletion,
  generateImage,
};
