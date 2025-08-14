import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import loginOnlyFans from '../ai-backend/proxy/puppeteerLogin.js';

const db = new Database(path.resolve('logs.db'));
const POLL_INTERVAL = 5000; // ms

async function processJob(job) {
  const now = new Date().toISOString();
  try {
    db.prepare("UPDATE jobs SET status='running', updated_at=? WHERE id=?").run(now, job.id);

    let result = {}; // Initialize result
    let browser = null;
    let page; // Declare page here to be accessible in this scope

    try {
      console.log(`[Worker] Attempting OnlyFans login for job ${job.id}`);
      // loginOnlyFans handles browser launch using puppeteer-extra with stealth and proxy
      const loginResult = await loginOnlyFans({ headless: true }); // Pass headless option
      browser = loginResult.browser; // Assign to the existing browser variable
      page = loginResult.page;
      console.log(`[Worker] OnlyFans login successful, page obtained for job ${job.id}`);

      console.log(`[Worker] Processing job ${job.id} with type: ${job.type}`);

      // Handle different job types
      switch (job.type) {
        case 'post_content':
          result = await handlePostContent(page, job);
          break;
        case 'send_dm':
          result = await handleSendDM(page, job);
          break;
        default:
          console.log(`[Worker] Processing job ${job.id} with folder: ${job.folder}`);
          // Legacy folder-based processing
          result = {
            message: `Successfully processed folder: ${job.folder}`,
          };
      }

    } catch (puppeteerError) {
      console.error(`[Worker] Puppeteer error during job ${job.id}:`, puppeteerError.message);
      throw puppeteerError; // Re-throw to be caught by the outer try-catch
    } finally {
      if (browser) {
        console.log(`[Worker] Closing Puppeteer browser for job ${job.id}`);
        await browser.close();
      }
    }

    db.prepare(
      "UPDATE jobs SET status='completed', result=?, updated_at=? WHERE id=?"
    ).run(JSON.stringify(result), new Date().toISOString(), job.id);
    console.log(`✅ Job ${job.id} completed`);
  } catch (err) {
    db.prepare(
      "UPDATE jobs SET status='failed', error=?, updated_at=? WHERE id=?"
    ).run(err.message, new Date().toISOString(), job.id);
    console.error(`❌ Job ${job.id} failed:`, err.message);
  }
}

/**
 * Handle posting content to OnlyFans
 */
async function handlePostContent(page, job) {
  try {
    const content = JSON.parse(job.content);
    console.log(`[Worker] Posting content for job ${job.id}:`, content.text?.substring(0, 50) + '...');

    // Navigate to the content posting page
    await page.goto('https://onlyfans.com/my/posts/create', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for the post creation form to load
    await page.waitForSelector('form[data-name="PostForm"]', { timeout: 15000 });
    
    // Add text content if provided
    if (content.text) {
      const textAreaSelector = 'div[data-placeholder="What\'s on your mind?"]';
      await page.waitForSelector(textAreaSelector, { timeout: 10000 });
      await page.click(textAreaSelector);
      await page.type(textAreaSelector, content.text, { delay: 50 });
    }

    // Handle media uploads if provided
    if (content.media && content.media.length > 0) {
      for (const mediaPath of content.media) {
        if (fs.existsSync(mediaPath)) {
          const fileInput = await page.$('input[type="file"]');
          if (fileInput) {
            await fileInput.uploadFile(mediaPath);
            // Wait for upload to process
            await page.waitForTimeout(2000);
          }
        }
      }
    }

    // Add delay before posting
    await page.waitForTimeout(1000);

    // Click the post button
    const postButtonSelector = 'button[data-name="post"]';
    await page.waitForSelector(postButtonSelector, { timeout: 10000 });
    await page.click(postButtonSelector);

    // Wait for post to be published
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    const postedUrl = page.url();
    console.log(`[Worker] Content posted successfully to: ${postedUrl}`);

    return {
      success: true,
      message: 'Content posted to OnlyFans successfully',
      postedUrl: postedUrl,
      contentPreview: content.text?.substring(0, 100),
      mediaCount: content.media?.length || 0
    };

  } catch (error) {
    console.error(`[Worker] Error posting content:`, error.message);
    
    // Take screenshot for debugging
    try {
      await page.screenshot({ 
        path: `post_error_${job.id}_${Date.now()}.png`, 
        fullPage: true 
      });
    } catch (screenshotError) {
      console.error('[Worker] Error taking screenshot:', screenshotError);
    }

    throw new Error(`Failed to post content: ${error.message}`);
  }
}

/**
 * Handle sending direct messages
 */
async function handleSendDM(page, job) {
  try {
    const content = JSON.parse(job.content);
    const { sendDirectMessage } = await import('../ai-backend/proxy/puppeteerActions.js');
    
    console.log(`[Worker] Sending DM for job ${job.id} to user: ${content.targetUserId}`);
    
    const result = await sendDirectMessage(page, content.targetUserId, content.message);
    
    if (result.success) {
      return {
        success: true,
        message: `DM sent successfully to user ${content.targetUserId}`,
        targetUserId: content.targetUserId,
        messagePreview: content.message.substring(0, 50) + '...'
      };
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error(`[Worker] Error sending DM:`, error.message);
    throw new Error(`Failed to send DM: ${error.message}`);
  }
}

function poll() {
  const job = db
    .prepare("SELECT * FROM jobs WHERE status='queued' ORDER BY created_at ASC LIMIT 1")
    .get();
  if (job) {
    console.log(`🔄 Processing job ${job.id} (type: ${job.type || 'legacy'})`);
    processJob(job);
  }
}

console.log(`🕒 Worker started—polling every ${POLL_INTERVAL/1000}s`);
setInterval(poll, POLL_INTERVAL);