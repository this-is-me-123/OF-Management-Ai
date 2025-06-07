import Database from 'better-sqlite3';
import path from 'path';
// import puppeteer from 'puppeteer'; // No longer needed as loginOnlyFans handles browser launch
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

      console.log(`[Worker] Processing job ${job.id} with folder: ${job.folder}`);

      // TODO: Navigate to the content posting page
      // await page.goto('https://onlyfans.com/my/posts/create', { waitUntil: 'networkidle2' });

      // TODO: Read content from job.folder (e.g., text, media files)
      // const contentToPost = readContentFromFolder(job.folder);

      // TODO: Use Puppeteer to fill in the post details and upload media
      // await page.type('textarea[name="text"]', contentToPost.text);
      // if (contentToPost.mediaPath) {
      //   const fileInput = await page.$('input[type=file]');
      //   await fileInput.uploadFile(contentToPost.mediaPath);
      // }
      // await page.click('button[type="submit"]'); // Or whatever the post button selector is
      // await page.waitForNavigation({ waitUntil: 'networkidle2' });

      console.log(`[Worker] Puppeteer actions for job ${job.id} would be performed here.`);
      // For now, simulate a successful result
      result = {
        message: `Successfully processed folder: ${job.folder}`,
        // postedUrl: page.url() // Example: capture the URL of the new post
      };

    } catch (puppeteerError) {
      console.error(`[Worker] Puppeteer error during job ${job.id}:`, puppeteerError.message);
      // Update the main error object to reflect Puppeteer failure if not already an error
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

function poll() {
  const job = db
    .prepare("SELECT * FROM jobs WHERE status='queued' ORDER BY created_at ASC LIMIT 1")
    .get();
  if (job) {
    console.log(`🔄 Processing job ${job.id}`);
    processJob(job);
  }
}

console.log(`🕒 Worker started—polling every ${POLL_INTERVAL/1000}s`);
setInterval(poll, POLL_INTERVAL);