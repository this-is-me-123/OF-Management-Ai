const puppeteerCore = require('puppeteer-core');
const { addExtra } = require('puppeteer-extra'); // Import the addExtra wrapper
const puppeteer = addExtra(puppeteerCore); // This is now your puppeteer-extra instance using puppeteer-core
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { spawnSync } = require('child_process'); // For diagnostic spawn

// Configure and use the Recaptcha plugin if API key is available
const TWO_CAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY;
if (TWO_CAPTCHA_API_KEY) {
  console.log('[PuppeteerLogin] 2Captcha API Key found in .env, enabling RecaptchaPlugin.');
  puppeteer.use(
    RecaptchaPlugin({
      provider: {
        id: '2captcha',
        token: TWO_CAPTCHA_API_KEY,
      },
      visualFeedback: true, // Shows a visual cue. Useful for debugging.
      throwOnError: true    // Throws an error if the CAPTCHA solving fails.
    })
  );
} else {
  console.warn('[PuppeteerLogin] WARNING: TWOCAPTCHA_API_KEY not found in .env. Recaptcha plugin will NOT be enabled. Login will likely fail if a CAPTCHA is presented.');
}

puppeteer.use(StealthPlugin());

let _browserInstance = null;
let _pageInstance = null;

function setBrowserPage(browser, page) {
  _browserInstance = browser;
  _pageInstance = page;
  // console.log('[PuppeteerLoginManager] Global browser and page instances updated.');
}

function getBrowserPage() {
  return { browser: _browserInstance, page: _pageInstance };
}

const HOME_ELEMENT_SELECTOR = 'span.b-inside-el.g-text-ellipsis'; // Selector for "Home" link, indicates login

/**
 * Checks if the current session in the given page is logged into OnlyFans.
 * It does this by trying to find a known element that only appears when logged in (e.g., "Home" link).
 * @param {object} page - Puppeteer page object.
 * @returns {Promise<boolean>} True if logged in, false otherwise.
 */
async function checkLoginStatus(page) {
  if (!page || page.isClosed()) {
    console.error('[PuppeteerLogin] Page is not valid for checking login status.');
    return false;
  }
  try {
    console.log('[PuppeteerLogin] Checking login status...');
    try {
        await page.waitForSelector(HOME_ELEMENT_SELECTOR, { timeout: 10000, visible: true });
        console.log('[PuppeteerLogin] Login status: Logged IN (Home element found on current page).');
        return true;
    } catch (e) {
        console.log('[PuppeteerLogin] Home element not on current page, navigating to OnlyFans home to check status.');
        await page.goto('https://onlyfans.com/', { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector(HOME_ELEMENT_SELECTOR, { timeout: 15000, visible: true });
        console.log('[PuppeteerLogin] Login status: Logged IN (Home element found after navigating to home).');
        return true;
    }
  } catch (error) {
    console.warn('[PuppeteerLogin] Login status: Logged OUT (Home element not found). Error:', error.message);
    return false;
  }
}

/**
 * Logs into OnlyFans.
 * Can use an existing browser instance or launch a new one.
 * @param {object} [options={}] - Options for login.
 * @param {boolean} [options.headless=true] - Whether to run in headless mode (if launching new browser).
 * @param {object} [options.existingBrowser=null] - An existing Puppeteer browser instance.
 * @returns {Promise<{browser: object, page: object, success: boolean, error: string|null}>}
 */
async function loginOnlyFans(options = {}) {
  console.log('[PuppeteerLogin] Entering loginOnlyFans function. CODE VERSION: FULL_REPLACE_V3_FINAL');
  let browser = options.existingBrowser;
  let page;
  let newBrowserLaunched = false; // Flag to track if this call launched the browser
  const { OF_EMAIL, OF_PASSWORD } = process.env;

  if (!OF_EMAIL || !OF_PASSWORD) {
    console.error('[PuppeteerLogin] Error: OF_EMAIL and OF_PASSWORD environment variables must be set.');
    return { browser: null, page: null, success: false, error: 'OnlyFans credentials not found in environment variables.' };
  }

  const useProxy = process.env.PROXY_HOST && process.env.PROXY_PORT && process.env.PROXY_USER && process.env.PROXY_PASS;

  try {
    // Section 1: Browser Launch or Acquisition
    if (!browser || !browser.isConnected()) {
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.log('!!! PUPPETEERLOGIN.JS - LAUNCHING NEW BROWSER (FULL_REPLACE_V3_FINAL) !!!!');
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.log('[PuppeteerLogin] No existing browser or disconnected. Launching new browser...');
      newBrowserLaunched = true;
      const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Recommended for Docker environments
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        // '--single-process', // Disables sandbox for Linux, use with caution
        '--disable-gpu'
      ];

      if (useProxy) {
        console.log('[PuppeteerLogin] Proxy environment variables found. Using proxy.');
        const proxyServer = `${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
        launchArgs.push(`--proxy-server=${proxyServer}`);
      } else {
        console.log('[PuppeteerLogin] No proxy variables. Direct connection.');
      }

      const chromeExecutablePathForPuppeteer = '/usr/bin/google-chrome-stable';
      const chromeExecutablePathForSpawn = '/opt/google/chrome/chrome';
      const effectiveHeadless = options.headless !== undefined ? options.headless : (process.env.HEADLESS !== 'false');

      console.log(`[PuppeteerLogin Diagnostics] Testing Chrome with spawnSync: ${chromeExecutablePathForSpawn} --version`);
      try {
        const chromeVersion = spawnSync(chromeExecutablePathForSpawn, ['--version']);
        console.log(`[PuppeteerLogin Diagnostics] spawnSync status: ${chromeVersion.status}`);
        if (chromeVersion.stdout) console.log(`[PuppeteerLogin Diagnostics] spawnSync stdout: ${chromeVersion.stdout.toString().trim()}`);
        if (chromeVersion.stderr) console.log(`[PuppeteerLogin Diagnostics] spawnSync stderr: ${chromeVersion.stderr.toString().trim()}`);
        if (chromeVersion.error) console.error(`[PuppeteerLogin Diagnostics] spawnSync error: ${JSON.stringify(chromeVersion.error)}`);
      } catch (e) {
        console.error(`[PuppeteerLogin Diagnostics] CATCH during spawnSync: ${e.message}`);
      }

      console.log(`[PuppeteerLogin] Launching Puppeteer: ${chromeExecutablePathForPuppeteer}, headless: ${effectiveHeadless}, args: ${JSON.stringify(launchArgs)}`);
      browser = await puppeteer.launch({
        executablePath: chromeExecutablePathForPuppeteer,
        headless: effectiveHeadless,
        args: launchArgs,
        dumpio: true // Log browser process stdout/stderr
      });
      console.log('[PuppeteerLogin] Puppeteer browser launched.');
      setBrowserPage(browser, null); // Set global browser, page will be created next
    } else {
      console.log('[PuppeteerLogin] Using existing browser instance.');
      const { browser: globalBrowser } = getBrowserPage();
      if (browser !== globalBrowser) {
        console.warn('[PuppeteerLogin] Existing browser is different from global. Updating global browser instance.');
        setBrowserPage(browser, null); // Page will be handled next
      }
    }

    // Section 2: Page Acquisition and Setup
    let { page: globalPage } = getBrowserPage();
    if (globalPage && !globalPage.isClosed()) {
      page = globalPage;
      console.log('[PuppeteerLogin] Using existing global page.');
    } else {
      console.log('[PuppeteerLogin] No existing global page or page is closed. Creating new page.');
      page = await browser.newPage();
      setBrowserPage(browser, page); // Update global state with new page
      console.log('[PuppeteerLogin] New page created and set globally.');
    }

    await page.setViewport({ width: 1280, height: 800 });
    if (useProxy) {
      console.log('[PuppeteerLogin] Authenticating proxy for page...');
      await page.authenticate({ username: process.env.PROXY_USER, password: process.env.PROXY_PASS });
      console.log('[PuppeteerLogin] Proxy authentication for page successful.');
    }

    // Section 3: Navigation and Login Logic
    console.log('[PuppeteerLogin] Navigating to OnlyFans main page...');
    await page.goto('https://onlyfans.com/', { waitUntil: 'networkidle0', timeout: 60000 });

    const emailSelector = 'input[name="email"]';
    const passwordSelector = 'input[name="password"]';
    const loginButtonSelector = 'button[type="submit"]';

    console.log('[PuppeteerLogin] Entering credentials...');
    await page.waitForSelector(emailSelector, { timeout: 15000 });
    await page.type(emailSelector, OF_EMAIL, { delay: 100 });
    await page.waitForSelector(passwordSelector, { timeout: 10000 });
    await page.type(passwordSelector, OF_PASSWORD, { delay: 100 });

    console.log('[PuppeteerLogin] Clicking login button...');
    await page.click(loginButtonSelector);

    console.log('[PuppeteerLogin] Waiting for navigation/CAPTCHA after login click (max 30s)...');
    try {
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
        console.log('[PuppeteerLogin] Navigation after login click completed.');
    } catch (e) {
        console.warn(`[PuppeteerLogin] waitForNavigation after login click timed out or failed: ${e.message}. Checking for CAPTCHA or login status.`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000)); 

    // Section 4: CAPTCHA Handling (if necessary)
    console.log('[PuppeteerLogin] Attempting to detect and solve CAPTCHA if present...');
        try {
            const captchaCheckScreenshotPath = '/tmp/captcha_check_screenshot.png';
            await page.screenshot({ path: captchaCheckScreenshotPath, fullPage: true });
            console.log(`[PuppeteerLogin] Screenshot taken before CAPTCHA solving attempts: ${captchaCheckScreenshotPath}`);
        } catch (ssError) {
            console.error(`[PuppeteerLogin] Failed to take screenshot before CAPTCHA check: ${ssError.message}`);
        }
    let captchaSolvedOrNotPresent = false;
    const maxCaptchaRetries = 3;
    const captchaRetryDelay = 7000; // 7 seconds

    for (let attempt = 1; attempt <= maxCaptchaRetries && !captchaSolvedOrNotPresent; attempt++) {
      try {
        if (attempt > 1) {
            console.log(`[PuppeteerLogin] Retrying CAPTCHA, attempt ${attempt}/${maxCaptchaRetries}...`);
            await new Promise(resolve => setTimeout(resolve, captchaRetryDelay));
        } else {
            console.log(`[PuppeteerLogin] CAPTCHA attempt ${attempt}/${maxCaptchaRetries}...`);
        }

        const solveResult = await page.solveRecaptchas();
        console.log(`[PuppeteerLogin] page.solveRecaptchas() result (attempt ${attempt}):`, JSON.stringify(solveResult));

        if (solveResult && solveResult.error) {
          console.error(`[PuppeteerLogin] Error from solveRecaptchas (attempt ${attempt}):`, solveResult.error);
          lastCaptchaError = solveResult.error;
          // Enhanced error logging
          console.error(`[PuppeteerLogin] Error caught during CAPTCHA phase (attempt ${attempt}). Raw error object:`, JSON.stringify(lastCaptchaError, Object.getOwnPropertyNames(lastCaptchaError)));
            
          let specificErrorMessage = "Unknown CAPTCHA error";
          if (lastCaptchaError && typeof lastCaptchaError === 'object') {
              if (lastCaptchaError.message && typeof lastCaptchaError.message === 'string' && lastCaptchaError.message.toLowerCase().includes('2captcha error:')) {
                  specificErrorMessage = lastCaptchaError.message;
              } else if (lastCaptchaError.error && typeof lastCaptchaError.error === 'string' && lastCaptchaError.error.toLowerCase().includes('2captcha error:')) {
                  specificErrorMessage = lastCaptchaError.error; // Matches structure logged by plugin
              } else if (lastCaptchaError.solutions && Array.isArray(lastCaptchaError.solutions) && lastCaptchaError.solutions.length > 0 && lastCaptchaError.solutions[0].error) {
                  specificErrorMessage = String(lastCaptchaError.solutions[0].error); // From solveRecaptchas result structure
              } else if (lastCaptchaError.message) {
                  specificErrorMessage = lastCaptchaError.message;
              } else {
                  specificErrorMessage = JSON.stringify(lastCaptchaError);
              }
          } else if (lastCaptchaError) {
              specificErrorMessage = String(lastCaptchaError);
          }
            
          console.error(`[PuppeteerLogin] Parsed CAPTCHA error (attempt ${attempt}): ${specificErrorMessage}`);
          console.error(`[PuppeteerLogin] Stack: ${lastCaptchaError.stack || 'No stack available'}`);

          const lowerSpecificErrorMessage = specificErrorMessage.toLowerCase();

          // Check for retryable errors (expanded list based on common 2Captcha issues)
          if (lowerSpecificErrorMessage.includes('error_captcha_unsolvable') ||
              lowerSpecificErrorMessage.includes('error_wrong_sitekey') || // Added
              lowerSpecificErrorMessage.includes('error_wrong_googlekey') || // Added
              lowerSpecificErrorMessage.includes('error_zero_balance') || // Added
              lowerSpecificErrorMessage.includes('api key not found') || // Added
              lowerSpecificErrorMessage.includes('invalid_credentials') || // Added
              lowerSpecificErrorMessage.includes('500 internal server error') ||
              lowerSpecificErrorMessage.includes('networkerror') ||
              (lowerSpecificErrorMessage.includes('timeout') && !lowerSpecificErrorMessage.includes('navigation timeout'))
          ) { 
              console.log('[PuppeteerLogin] Retryable 2Captcha service error detected, will retry.');
              continue; 
          } else {
              console.error('[PuppeteerLogin] Max retries reached for 2Captcha service error.');
              break; 
            console.warn('[PuppeteerLogin] Non-retryable error reported by solveRecaptchas plugin. CAPTCHA solving failed.');
            break; 
          }
        }

        if (solveResult && solveResult.solved && solveResult.solved.length > 0) {
          console.log('[PuppeteerLogin] CAPTCHA successfully solved.');
          captchaSolvedOrNotPresent = true;
          console.log('[PuppeteerLogin] Waiting for potential navigation after CAPTCHA (max 20s)...');
          await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 })
            .catch(e => console.warn(`[PuppeteerLogin] Navigation after CAPTCHA solve timed out/failed: ${e.message}`));
        } 
        else if (solveResult && solveResult.captchas && solveResult.captchas.length === 0) {
          console.log('[PuppeteerLogin] No CAPTCHA detected by solveRecaptchas.');
          captchaSolvedOrNotPresent = true;
        } 
        else if (solveResult && solveResult.captchas && solveResult.captchas.length > 0 && (!solveResult.solved || solveResult.solved.length === 0)) {
          console.warn(`[PuppeteerLogin] CAPTCHA detected but not solved (attempt ${attempt}). Result:`, JSON.stringify(solveResult));
          if (attempt < maxCaptchaRetries) {
            console.log('[PuppeteerLogin] Will retry solving detected CAPTCHA.');
            continue;
          } else {
            console.error('[PuppeteerLogin] Max retries reached; CAPTCHA detected but not solved.');
            break;
          }
        } 
        else {
            console.log(`[PuppeteerLogin] solveRecaptchas result in unexpected state or implies no action taken (attempt ${attempt}).`);
            captchaSolvedOrNotPresent = true; // Assuming no further action needed for this state.
        }

      } catch (captchaError) {
        console.warn(`[PuppeteerLogin] Error caught during CAPTCHA phase (attempt ${attempt}): ${captchaError.message}`);
        if(captchaError.stack) console.warn(`[PuppeteerLogin] Stack: ${captchaError.stack}`);
        if (attempt < maxCaptchaRetries) {
          console.log('[PuppeteerLogin] Will retry due to caught error.');
        } else {
          console.error('[PuppeteerLogin] Max retries reached after caught error during CAPTCHA phase.');
          break;
        }
      }
    } 

    if (!captchaSolvedOrNotPresent) {
        console.warn('[PuppeteerLogin] CAPTCHA was not successfully handled after all attempts. Login may fail if one was present.');
    }

    // Section 5: Login Verification
    console.log('[PuppeteerLogin] Verifying login status...');
    const loggedIn = await checkLoginStatus(page);

    if (loggedIn) {
      console.log('[PuppeteerLogin] Login successful!');
      return { browser, page, success: true, error: null };
    } else {
      console.error('[PuppeteerLogin] Login failed: Verification check failed.');
      // Ensure this path is writable in your Docker container
      await page.screenshot({ path: '/tmp/login_failed_screenshot.png' }).catch(e => console.warn('Failed to take screenshot on login failure:', e.message));
      throw new Error('Login verification failed after all steps.');
    }

  } catch (error) { // MAIN CATCH BLOCK
    console.error(`[PuppeteerLogin] CRITICAL ERROR in loginOnlyFans: ${error.message}`);
    console.error(`[PuppeteerLogin] Stack: ${error.stack}`);
    if (page && !page.isClosed()) {
        try {
            const errorScreenshotPath = '/tmp/critical_error_screenshot.png'; // Ensure this path is writable
            await page.screenshot({ path: errorScreenshotPath });
            console.log(`[PuppeteerLogin] Screenshot taken on error: ${errorScreenshotPath}`);
        } catch (screenshotError) {
            console.warn('[PuppeteerLogin] Failed to take screenshot on critical error:', screenshotError.message);
        }
    }
    if (newBrowserLaunched && browser && browser.isConnected()) {
      console.log('[PuppeteerLogin] Closing browser instance (launched by this function) due to error...');
      await browser.close().catch(closeError => console.warn('[PuppeteerLogin] Error closing browser:', closeError.message));
    }
    setBrowserPage(null, null); // Clear global state on any error path
    return { browser: null, page: null, success: false, error: error.message || 'An unspecified critical error occurred.' };
  }
}

module.exports = { 
  loginOnlyFans, 
  checkLoginStatus,
  getBrowserPage 
};
