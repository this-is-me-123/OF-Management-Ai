const openaiService = require('../openaiService'); // Path to the new consolidated OpenAI service

/**
 * Generates an advertising caption using OpenAI's chat completion.
 * @param {string} productDescription - Description of the product/service being advertised.
 * @param {string} [theme='general'] - Optional theme for the ad (e.g., 'teaser', 'direct_offer', 'story').
 * @param {Array<string>} [keywords=[]] - Optional array of keywords to try and include.
 * @param {string} [platform='OnlyFans'] - Optional platform hint (e.g., 'OnlyFans', 'Twitter', 'Instagram').
 * @returns {Promise<string|null>} The generated ad caption or null on error.
 */
async function generateAdCaption({ productDescription, theme = 'general', keywords = [], platform = 'OnlyFans' }) {
  if (!productDescription) {
    console.error('[AdService - Caption] Product description is required.');
    return null;
  }

  let promptContent = `Generate an engaging ad caption for ${platform}.\n`;
  promptContent += `Product/Service: ${productDescription}\n`;
  if (theme) promptContent += `Theme/Angle: ${theme}\n`;
  if (keywords.length > 0) promptContent += `Keywords to include if possible: ${keywords.join(', ')}\n`;
  promptContent += 'The caption should be catchy, persuasive, and include relevant hashtags. Aim for a friendly and appealing tone.';

  const messages = [{ role: 'user', content: promptContent }];

  try {
    console.log('[AdService - Caption] Generating ad caption with prompt:', promptContent);
    const caption = await openaiService.generateChatCompletion(messages);
    if (caption && !caption.startsWith('Error:')) {
      console.log('[AdService - Caption] Generated caption:', caption);
      return caption;
    } else {
      console.error('[AdService - Caption] Failed to generate caption or error returned:', caption);
      return null;
    }
  } catch (error) {
    console.error('[AdService - Caption] Unexpected error generating ad caption:', error.message);
    return null;
  }
}

/**
 * Generates an ad image using OpenAI's DALL-E.
 * @param {string} imagePrompt - Detailed description for the image.
 * @param {object} [options] - Optional DALL-E parameters.
 * @param {string} [options.size='1024x1024'] - Image size (e.g., '1024x1024', '1792x1024').
 * @param {string} [options.quality='standard'] - Image quality ('standard', 'hd') for DALL-E 3.
 * @param {string} [options.style='vivid'] - Image style ('vivid', 'natural') for DALL-E 3.
 * @param {string} [options.model='dall-e-3'] - DALL-E model to use.
 * @returns {Promise<string|null>} The URL of the generated image, or null on error.
 */
async function generateAdImage(imagePrompt, options = {}) {
  if (!imagePrompt) {
    console.error('[AdService - Image] Image prompt is required.');
    return null;
  }

  const defaultOptions = {
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
    model: 'dall-e-3', // Ensure this is a valid model you intend to use
    n: 1
  };

  const imageOptions = { ...defaultOptions, ...options };
  // DALL-E 3 only supports n=1, so enforce it if that model is chosen.
  if (imageOptions.model === 'dall-e-3') {
    imageOptions.n = 1;
  }

  try {
    console.log('[AdService - Image] Generating ad image with prompt:', imagePrompt, 'Options:', imageOptions);
    // The generateImage function expects the options object as the second argument directly
    const imageResult = await openaiService.generateImage(imagePrompt, imageOptions);
    
    if (imageResult && imageResult.length > 0 && imageResult[0].url) {
      console.log('[AdService - Image] Generated image URL:', imageResult[0].url);
      return imageResult[0].url; // Return the URL of the first image
    } else {
      console.error('[AdService - Image] Failed to generate image or no URL returned:', imageResult);
      return null;
    }
  } catch (error) {
    console.error('[AdService - Image] Unexpected error generating ad image:', error.message);
    return null;
  }
}

module.exports = { generateAdCaption, generateAdImage };
