// puppeteerActions.js
// This file will contain Puppeteer actions to be performed after login, e.g., sending DMs.

const CHAT_PAGE_URL_BASE = 'https://onlyfans.com/my/chats/chat/';
// TODO: Discover and confirm these selectors by inspecting the OnlyFans chat page
const MESSAGE_TEXT_AREA_SELECTOR = 'div.ProseMirror[data-placeholder="Type a message..."]'; // Updated from user HTML
const SEND_BUTTON_SELECTOR = 'button[at-attr="send_btn"]'; // Updated from user HTML

/**
 * Sends a direct message to a user on OnlyFans.
 * @param {object} page - The Puppeteer page object (already logged in and navigated).
 * @param {string} targetOfUserId - The OnlyFans user ID to send the message to.
 * @param {string} messageContent - The content of the message to send.
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function sendDirectMessage(page, targetOfUserId, messageContent) {
  console.log(`[PuppeteerActions] Attempting to send DM to OF User ID: ${targetOfUserId}`);
  const chatUrl = `${CHAT_PAGE_URL_BASE}${targetOfUserId}/`;

  try {
    console.log(`[PuppeteerActions] Navigating to chat page: ${chatUrl}`);
    await page.goto(chatUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('[PuppeteerActions] Successfully navigated to chat page.');

    console.log('[PuppeteerActions] Waiting for message text area...');
    await page.waitForSelector(MESSAGE_TEXT_AREA_SELECTOR, { visible: true, timeout: 15000 });
    console.log('[PuppeteerActions] Message text area found.');
    console.log('[PuppeteerActions] Adding 3-second delay before typing message...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[PuppeteerActions] Typing message...');
    await page.type(MESSAGE_TEXT_AREA_SELECTOR, messageContent, { delay: 100 });
    console.log('[PuppeteerActions] Message typed. Adding 2-second delay before finding send button...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[PuppeteerActions] Waiting for send button...');
    await page.waitForSelector(SEND_BUTTON_SELECTOR, { visible: true, timeout: 10000 });
    console.log('[PuppeteerActions] Send button found.');

    console.log('[PuppeteerActions] Clicking send button...');
    await page.click(SEND_BUTTON_SELECTOR);

    // Optional: Add a small delay or wait for some confirmation element if one exists
    // await page.waitForTimeout(2000); // Example delay

    console.log(`[PuppeteerActions] Successfully sent DM to ${targetOfUserId}.`);
    return { success: true, error: null };

  } catch (error) {
    console.error(`[PuppeteerActions] Error sending DM to ${targetOfUserId}:`, error.message);
    const screenshotPath = `dm_error_${targetOfUserId}_${Date.now()}.png`;
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`[PuppeteerActions] Screenshot taken on DM error: ${screenshotPath}`);
    } catch (screenshotError) {
      console.error('[PuppeteerActions] Error taking screenshot during DM error:', screenshotError);
    }
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendDirectMessage,
};
