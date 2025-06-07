const dotenvResult = require('dotenv').config({ path: require('path').resolve(__dirname, '.env') }); // Ensure .env in ai-backend is loaded

if (dotenvResult.error) {
  console.error('[TestAdFeatures] Error loading .env file:', dotenvResult.error);
} else {
  // console.log('[TestAdFeatures] .env file loaded. Parsed variables:', dotenvResult.parsed); // Cleaned up
  // console.log('[TestAdFeatures] SUPABASE_URL from process.env after dotenv:', process.env.SUPABASE_URL); // Cleaned up
  // console.log('[TestAdFeatures] SUPABASE_SERVICE_KEY from process.env after dotenv:', process.env.SUPABASE_SERVICE_KEY ? '********' : undefined); // Cleaned up
}

const supabase = require('./supabase_integration'); // Explicitly load supabase first
const { generateAdCaption, generateAdImage } = require('./ads/adService');
const { scheduleAd } = require('./ads/scheduling');

async function testAdServices() {
  console.log('Starting ad services test...');

  // 1. Test Ad Caption Generation
  const captionPrompt = 'A refreshing summer drink, perfect for sunny days by the pool. Highlights its natural ingredients and cool taste.';
  let adCaption = '';
  try {
    console.log(`\n[Test] Generating ad caption for prompt: "${captionPrompt}"`);
    adCaption = await generateAdCaption({ productDescription: captionPrompt });
    console.log('[Test] Generated Ad Caption:', adCaption);
    if (!adCaption || typeof adCaption !== 'string' || adCaption.trim() === '') {
        throw new Error('Generated caption was empty or invalid.');
    }
  } catch (error) {
    console.error('[Test] Error generating ad caption:', error.message);
    // Decide if you want to proceed without a caption or use a default
    adCaption = "Fallback: Check out our amazing new product!"; // Fallback caption
    console.log(`[Test] Using fallback caption: "${adCaption}"`);
  }

  // 2. Test Ad Image Generation
  const imagePrompt = adCaption; // Use the generated caption (or fallback) as the image prompt
  let adImageUrl = '';
  try {
    console.log(`\n[Test] Generating ad image for prompt: "${imagePrompt}"`);
    // You can customize DALL-E options here if needed, e.g., size, quality
    adImageUrl = await generateAdImage(imagePrompt, '1024x1024', 'standard'); 
    console.log('[Test] Generated Ad Image URL:', adImageUrl);
    if (!adImageUrl || !adImageUrl.startsWith('http')) {
        throw new Error('Generated image URL was empty or invalid.');
    }
  } catch (error) {
    console.error('[Test] Error generating ad image:', error.message);
    // Decide if you want to proceed without an image URL or use a default/placeholder
    adImageUrl = 'https://via.placeholder.com/1024.png?text=Ad+Image+Error'; // Fallback image URL
    console.log(`[Test] Using fallback image URL: "${adImageUrl}"`);
  }

  // 3. Test Ad Scheduling
  if (adCaption && adImageUrl) {
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + 5); // Schedule 5 minutes from now

    const adDetails = {
      ad_campaign_id: null, // Optional: replace with a valid UUID if testing campaigns
      caption: adCaption,
      image_url: adImageUrl,
      platforms: ['onlyfans', 'instagram'], // Example platforms
      scheduled_at: scheduledTime.toISOString(),
    };

    try {
      console.log('\n[Test] Scheduling ad with details:', adDetails);
      const scheduledResult = await scheduleAd(supabase, adDetails);
      console.log('[Test] Ad scheduled successfully:', scheduledResult);
    } catch (error) {
      console.error('[Test] Error scheduling ad:', error.message);
    }
  } else {
    console.warn('\n[Test] Skipping ad scheduling due to missing caption or image URL from previous steps.');
  }

  console.log('\nAd services test finished.');
}

testAdServices().catch(error => {
  console.error('Unhandled error in testAdServices:', error);
});
