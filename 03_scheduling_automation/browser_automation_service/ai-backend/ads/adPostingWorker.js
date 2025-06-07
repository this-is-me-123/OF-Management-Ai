const { supabase } = require('../supabase_integration'); // Adjust path as needed
const { loginOnlyFans, getBrowserPage, checkLoginStatus } = require('../proxy/puppeteerLogin'); // For OF posting
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Ensure a temporary directory for images exists
const TEMP_IMAGE_DIR = path.join(__dirname, 'temp_images');
// We might need a library like node-cron for more robust scheduling, or a simple setInterval for now.

const CHECK_INTERVAL_MS = 60 * 1000; // Check for new ads every 60 seconds

/**
 * Fetches ads that are due to be posted.
 * @returns {Promise<Array<object>|null>} Array of ad objects or null on error.
 */
async function fetchDueAds() {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('scheduled_ads')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true }); // Process older ads first

    if (error) {
      console.error('[AdPostingWorker] Error fetching due ads:', error.message);
      return null;
    }
    return data || [];
  } catch (e) {
    console.error('[AdPostingWorker] Exception fetching due ads:', e.message);
    return null;
  }
}

/**
 * Updates the status and post_result of an ad.
 * @param {string} adId - The ID of the ad to update.
 * @param {string} status - The new status (e.g., 'processing', 'posted', 'failed').
 * @param {object} [postResult] - Optional result of the posting attempt.
 * @param {number} [retryCount] - Optional new retry count.
 * @returns {Promise<object|null>} The updated ad object or null on error.
 */
async function updateAdStatus(adId, status, postResult, retryCount) {
  try {
    const updatePayload = {
      status,
      last_attempted_at: new Date().toISOString(),
    };
    if (postResult !== undefined) updatePayload.post_result = postResult;
    if (retryCount !== undefined) updatePayload.retry_count = retryCount;

    const { data, error } = await supabase
      .from('scheduled_ads')
      .update(updatePayload)
      .eq('id', adId)
      .select();

    if (error) {
      console.error(`[AdPostingWorker] Error updating ad ${adId} to status ${status}:`, error.message);
      return null;
    }
    return data && data.length > 0 ? data[0] : null;
  } catch (e) {
    console.error(`[AdPostingWorker] Exception updating ad ${adId}:`, e.message);
    return null;
  }
}

/**
 * Posts content to OnlyFans.
 * This function will need to handle logging in, navigating, and posting.
 * @param {object} ad - The ad object from scheduled_ads table.
 * @param {object} page - Puppeteer page object.
 * @returns {Promise<{success: boolean, details: object}>}
 */
async function postToOnlyFans(ad, page) {
  console.log(`[AdPostingWorker] Attempting to post ad ID ${ad.id} to OnlyFans.`);
  const { caption, image_url } = ad;
  let tempImagePath = null; // To store path of downloaded image for cleanup

  try {
    // 0. Ensure temp directory exists
    try {
      await fs.mkdir(TEMP_IMAGE_DIR, { recursive: true });
    } catch (mkdirError) {
      // Log error but attempt to continue, os.tmpdir() will be fallback.
      console.warn(`[AdPostingWorker] Could not create/access custom temp directory ${TEMP_IMAGE_DIR}: ${mkdirError.message}.`);
    }

    // 1. Navigate to the create post page
    const createPostUrl = 'https://onlyfans.com/posts/create';
    console.log(`[AdPostingWorker] Navigating to ${createPostUrl}`);
    await page.goto(createPostUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    await page.waitForTimeout(3000); // Allow page to settle

    // 2. Fill in the caption
    const captionSelector = 'div[aria-label="Textbox field"]';
    console.log(`[AdPostingWorker] Waiting for caption input: ${captionSelector}`);
    await page.waitForSelector(captionSelector, { timeout: 30000 });
    console.log(`[AdPostingWorker] Typing caption: ${caption}`);
    await page.type(captionSelector, caption, { delay: 100 });

    // 3. Handle image upload (if image_url is present)
    if (image_url) {
      console.log(`[AdPostingWorker] Processing image_url: ${image_url}`);
      try {
        // Download image
        const response = await axios({
          method: 'GET',
          url: image_url,
          responseType: 'arraybuffer',
        });

        // Define temporary file path
        const uniqueFilename = `ad_${ad.id}_${Date.now()}${path.extname(new URL(image_url).pathname) || '.jpg'}`;
        let baseTempDir = TEMP_IMAGE_DIR;
        try {
            await fs.access(TEMP_IMAGE_DIR); // Check if our custom temp dir is accessible
        } catch {
            console.warn(`[AdPostingWorker] Custom temp_images directory not accessible, using OS default: ${os.tmpdir()}`);
            baseTempDir = os.tmpdir(); // Fallback
        }
        tempImagePath = path.join(baseTempDir, uniqueFilename);

        await fs.writeFile(tempImagePath, response.data);
        console.log(`[AdPostingWorker] Image downloaded to ${tempImagePath}`);

        // Upload image
        // IMPORTANT: Replace 'input[type="file"]' with the ACTUAL CSS SELECTOR for the file input on OnlyFans.
        // This might be an invisible input, or you might need to click a button that triggers this input.
        const fileInputSelector = 'input[type="file"]'; // <<< --- !!! USER ACTION REQUIRED: VERIFY/UPDATE THIS SELECTOR !!!
        console.log(`[AdPostingWorker] Waiting for file input: ${fileInputSelector}`);
        
        // Optional: If the input is hidden, you might need to make it visible first:
        // await page.evaluate(sel => { document.querySelector(sel).style.display = 'block'; }, fileInputSelector);
        
        await page.waitForSelector(fileInputSelector, { timeout: 15000 /* , visible: true (if not hidden and you don't make it visible) */ });
        await page.uploadFile(fileInputSelector, tempImagePath);
        console.log(`[AdPostingWorker] Image selected for upload: ${tempImagePath}`);

        // Wait for upload to complete
        // IMPORTANT: This is highly site-specific. Replace the timeout with a reliable wait condition.
        // Examples:
        //  - Wait for a thumbnail image to appear: await page.waitForSelector('img.uploaded-thumbnail-selector', { timeout: 60000 });
        //  - Wait for a specific network response: await page.waitForResponse(response => response.url().includes('/api/upload/complete') && response.status() === 200, { timeout: 60000 });
        //  - Wait for a loading spinner to disappear: await page.waitForSelector('.spinner-selector', { hidden: true, timeout: 60000 });
        console.log('[AdPostingWorker] Waiting for image upload to process (placeholder timeout)...');
        await page.waitForTimeout(20000); // <<< --- !!! USER ACTION REQUIRED: REPLACE WITH RELIABLE WAIT !!!
        console.log('[AdPostingWorker] Image upload processed (assumed by placeholder timeout).');

      } catch (imgError) {
        console.error(`[AdPostingWorker] Error during image processing for ad ${ad.id}: ${imgError.message}`);
        // If image upload fails, we mark the post as failed for now.
        // Alternatively, you could allow posting without image if that's desired.
        if (tempImagePath) { // Attempt cleanup even if upload failed mid-way
          await fs.unlink(tempImagePath).catch(e => console.warn(`[AdPostingWorker] Failed to clean up temp image ${tempImagePath} after error: ${e.message}`));
        }
        return { success: false, details: { error: `Image processing failed: ${imgError.message}`, stack: imgError.stack } };
      }
    }

    // 4. Submit the post
    const submitButtonSelector = 'button[at-attr="submit_post"]';
    console.log(`[AdPostingWorker] Waiting for submit button: ${submitButtonSelector}`);
    await page.waitForSelector(submitButtonSelector, { visible: true, timeout: 30000 });
    
    const isDisabled = await page.$eval(submitButtonSelector, button => button.disabled);
    if (isDisabled) {
      console.error('[AdPostingWorker] Submit button is disabled. Cannot post. Check for pending uploads or content errors.');
      return { success: false, details: { error: 'Submit button disabled. Possible pending image upload or content issue.'}};
    }

    console.log('[AdPostingWorker] Clicking submit button.');
    await page.click(submitButtonSelector);

    // 5. Verify post success
    // IMPORTANT: Replace timeout with a reliable indicator of post success.
    // Examples:
    //  - Navigation to the new post URL.
    //  - Appearance of a success message/toast: await page.waitForSelector('.success-toast-selector', { timeout: 30000 });
    //  - Checking if the post appears on the profile feed.
    console.log('[AdPostingWorker] Waiting for post submission to confirm (placeholder timeout)...');
    await page.waitForTimeout(15000); // <<< --- !!! USER ACTION REQUIRED: REPLACE WITH RELIABLE WAIT !!!
    console.log(`[AdPostingWorker] Post for ad ID ${ad.id} submitted to OnlyFans.`);
    return { success: true, details: { message: 'Post submitted successfully (assumed by placeholder timeout).' } };

  } catch (error) {
    console.error(`[AdPostingWorker] Error posting ad ID ${ad.id} to OnlyFans:`, error.message);
    return { success: false, details: { error: error.message, stack: error.stack } };
  } finally {
    // Cleanup: Delete the temporary image file if it was created
    if (tempImagePath) {
      try {
        await fs.unlink(tempImagePath);
        console.log(`[AdPostingWorker] Temporary image ${tempImagePath} deleted.`);
      } catch (cleanupError) {
        console.warn(`[AdPostingWorker] Error deleting temporary image ${tempImagePath}: ${cleanupError.message}`);
      }
    }
  }
}

/**
 * Processes a single ad: attempts to post it to its platforms.
 * @param {object} ad - The ad object.
 * @param {object} browser - Puppeteer browser instance.
 */
async function processAd(ad, browser) { // browser is the main browser instance
  console.log(`[AdPostingWorker] Processing ad ID: ${ad.id}`);
  await updateAdStatus(ad.id, 'processing');

  let overallSuccess = true;
  const platformResults = {};

  for (const platform of ad.platforms) {
    let result = { success: false, details: { error: 'Platform not supported or posting failed.' } };
    if (platform.toLowerCase() === 'onlyfans') {
      let currentPage; // Declare currentPage here to be accessible in finally
      try {
        currentPage = await getBrowserPage(browser);
        if (!currentPage) {
          console.error(`[AdPostingWorker] Failed to get a new page for ad ${ad.id}. Skipping OF post.`);
          result = { success: false, details: { error: 'Failed to create Puppeteer page.' } };
        } else {
          const isLoggedIn = await checkLoginStatus(currentPage);
          if (!isLoggedIn) {
            console.warn(`[AdPostingWorker] Session expired for ad ${ad.id}. Attempting to re-login in the same browser...`);
            if (currentPage && !currentPage.isClosed()) await currentPage.close(); // Close the old page before getting a new one
            
            const loginAttempt = await loginOnlyFans({ existingBrowser: browser, headless: process.env.NODE_ENV !== 'development' });
            if (loginAttempt.success && loginAttempt.page) {
              console.log(`[AdPostingWorker] Re-login successful for ad ${ad.id}.`);
              currentPage = loginAttempt.page;
            } else {
              console.error(`[AdPostingWorker] Failed to re-login for ad ${ad.id}. Error: ${loginAttempt.error}`);
              result = { success: false, details: { error: `Re-login failed: ${loginAttempt.error}` } };
              // If re-login fails, currentPage might be null or closed from the attempt. Fall through to finally.
            }
          }

          // Only proceed to post if we have a valid page and (re)login was successful or not needed
          // and a failure hasn't already been recorded in 'result'
          if (result.success === undefined && currentPage && !currentPage.isClosed()) { // result.success is undefined if not set by failed re-login
             result = await postToOnlyFans(ad, currentPage);
          } else if (result.success === undefined) { // if currentPage is not usable and no error set yet
             result = { success: false, details: { error: 'Page became unusable before posting attempt.'}};
          }
        }
      } catch (e) {
        console.error(`[AdPostingWorker] Error during OnlyFans processing for ad ${ad.id}:`, e.message);
        result = { success: false, details: { error: e.message, stack: e.stack } };
      } finally {
        if (currentPage && !currentPage.isClosed()) {
          await currentPage.close();
        }
      }
    } else { // Handle other platforms or unsupported platforms
      console.warn(`[AdPostingWorker] Platform ${platform} not supported for ad ID ${ad.id}.`);
      result.details.error = `Platform '${platform}' not supported.`;
      // success remains false as initialized
    }
    platformResults[platform] = result;
    if (!result.success) overallSuccess = false;
  }

  const finalStatus = overallSuccess ? 'posted' : 'failed';
  const newRetryCount = finalStatus === 'failed' ? (ad.retry_count || 0) + 1 : ad.retry_count;
  await updateAdStatus(ad.id, finalStatus, { platformResults }, newRetryCount);
  console.log(`[AdPostingWorker] Finished processing ad ID ${ad.id} with status: ${finalStatus}`);
}

/**
 * Main loop for the ad posting worker.
 */
async function main() {
  console.log('[AdPostingWorker] Starting up...');
  let browser;
  try {
    // Initialize browser once. loginOnlyFans typically launches its own browser.
    // We need a way to get a browser instance that can be reused or manage pages.
    // For now, let's assume loginOnlyFans can provide a browser or we adapt it.
    // This is a simplification; robust browser management is key.
    const loginResult = await loginOnlyFans({ headless: process.env.NODE_ENV !== 'development' });
    if (!loginResult.success || !loginResult.browser) {
      console.error(`[AdPostingWorker] Failed to initialize and login to OnlyFans. Worker cannot start. Error: ${loginResult.error}`);
      if (loginResult.browser) await loginResult.browser.close();
      return;
    }
    browser = loginResult.browser;
    if (loginResult.page && !loginResult.page.isClosed()) {
        await loginResult.page.close(); // Close the initial page from login, we'll open new ones per ad.
    }

    console.log('[AdPostingWorker] Browser initialized and logged in. Starting ad processing loop.');

    setInterval(async () => {
      console.log('[AdPostingWorker] Checking for due ads...');
      const dueAds = await fetchDueAds();
      if (dueAds && dueAds.length > 0) {
        console.log(`[AdPostingWorker] Found ${dueAds.length} ad(s) to process.`);
        for (const ad of dueAds) {
          if (!browser || !browser.isConnected()) {
            console.error('[AdPostingWorker] Browser is not connected. Attempting to re-initialize.');
            // Attempt to re-login and get a new browser instance
            const newLoginResult = await loginOnlyFans({ headless: process.env.NODE_ENV !== 'development' });
            if (!newLoginResult.success || !newLoginResult.browser) {
              console.error(`[AdPostingWorker] Failed to re-initialize browser. Error: ${newLoginResult.error}. Skipping current cycle.`);
              if (newLoginResult.browser) await newLoginResult.browser.close(); // Close if it was created but login failed
              browser = null; // Ensure browser is marked as dead
              return; // Skip this cycle
            }
            browser = newLoginResult.browser;
            if (newLoginResult.page && !newLoginResult.page.isClosed()) await newLoginResult.page.close();
            console.log('[AdPostingWorker] Browser re-initialized.');
          }
          await processAd(ad, browser);
        }
      } else if (dueAds) {
        console.log('[AdPostingWorker] No due ads found.');
      } else {
        console.log('[AdPostingWorker] Error occurred while fetching due ads. Will retry next cycle.');
      }
    }, CHECK_INTERVAL_MS);

  } catch (error) {
    console.error('[AdPostingWorker] Critical error during main worker setup:', error.message, error.stack);
    if (browser) await browser.close();
    // Consider a more robust restart mechanism or alerting here.
  }
  // Note: This simple structure doesn't handle graceful shutdown well.
  // For production, SIGINT/SIGTERM handling would be needed to close the browser.
}

// Start the worker
main().catch(err => {
  console.error('[AdPostingWorker] Unhandled error in main execution:', err);
  process.exit(1); // Exit if main setup fails critically
});
