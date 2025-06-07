const puppeteerCore = require('puppeteer-core');
const { addExtra } = require('puppeteer-extra'); // Import the addExtra wrapper
const puppeteer = addExtra(puppeteerCore); // This is now your puppeteer-extra instance using puppeteer-core
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

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
  console.log('[PuppeteerLogin] Entering loginOnlyFans function.');
  try {
    console.log(`[PuppeteerLogin] Attempting to get executable path from puppeteer-extra instance...`);
    console.log(`[PuppeteerLogin] Puppeteer executable path: ${puppeteer.executablePath()}`);
  } catch (e) {
    console.error('[PuppeteerLogin] Error getting executable path:', e);
  }
  let browser = options.existingBrowser;
  let page;
  const { OF_EMAIL, OF_PASSWORD } = process.env;

  if (!OF_EMAIL || !OF_PASSWORD) {
    console.error('[PuppeteerLogin] Error: OF_EMAIL and OF_PASSWORD environment variables must be set.');
    return { browser: null, page: null, success: false, error: 'OnlyFans credentials not found in environment variables.' };
  }

  try {
    if (!browser || !browser.isConnected()) {
      console.log('[PuppeteerLogin] No existing browser or not connected, launching new browser...');

      console.log('[PuppeteerLogin] Accessing environment variables for proxy...');
      const { PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASS } = process.env;
      console.log(`[PuppeteerLogin] PROXY_HOST detected: ${PROXY_HOST ? PROXY_HOST : 'Not Set'}`);
      console.log(`[PuppeteerLogin] PROXY_PORT detected: ${PROXY_PORT ? PROXY_PORT : 'Not Set'}`);
      console.log(`[PuppeteerLogin] PROXY_USER detected: ${PROXY_USER ? 'Set' : 'Not Set'}`); // Avoid logging actual user/pass
      console.log(`[PuppeteerLogin] PROXY_PASS detected: ${PROXY_PASS ? 'Set' : 'Not Set'}`); // Avoid logging actual user/pass
      const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
      let useProxy = PROXY_HOST && PROXY_PORT && PROXY_USER && PROXY_PASS;

      if (useProxy) {
        console.log('[PuppeteerLogin] Proxy environment variables found. Attempting to use proxy.');
        const proxyServer = `${PROXY_HOST}:${PROXY_PORT}`;
        console.log(`[PuppeteerLogin] Setting proxy server argument to: --proxy-server=${proxyServer}`);
        launchArgs.push(`--proxy-server=${proxyServer}`);
      } else {
        console.log('[PuppeteerLogin] Proxy environment variables not fully set or not found. Attempting direct connection.');
      }

      console.log('[PuppeteerLogin] Preparing to launch Puppeteer browser with args:', launchArgs);
    try {
      browser = await puppeteer.launch({
        headless: options.headless !== undefined ? options.headless : (process.env.HEADLESS === 'false' ? false : true),
        args: launchArgs,
        dumpio: true
      });
      console.log('[PuppeteerLogin] Puppeteer browser launched successfully.');
    } catch (launchError) {
      console.error('[PuppeteerLogin] CRITICAL: Error during puppeteer.launch():', launchError);
      throw launchError;
    }

    console.log('[PuppeteerLogin] Creating new page...');
    page = await browser.newPage();
    setBrowserPage(browser, page); // Set global instances now that we have a page
    console.log('[PuppeteerLogin] New page created.');

      if (useProxy) {
        console.log('[PuppeteerLogin] Authenticating proxy...');
        try {
          await page.authenticate({ username: PROXY_USER, password: PROXY_PASS });
          console.log('[PuppeteerLogin] Proxy authentication successful (or no error thrown if auth not strictly needed by proxy).');
        } catch (authError) {
          console.error('[PuppeteerLogin] CRITICAL: Error during page.authenticate():', authError);
          // Decide if we should throw or just warn, depending on proxy type
          // For now, let's throw to see if this is the failure point
          throw authError;
        }
      }
    } else {
      console.log('[PuppeteerLogin] Using existing browser instance.');
      // 'browser' variable already holds options.existingBrowser
      let { page: globalPage, browser: globalBrowser } = getBrowserPage();
      
      if (browser === globalBrowser && globalPage && !globalPage.isClosed()) {
        page = globalPage;
        console.log('[PuppeteerLogin] Using globally managed page for the existing browser.');
      } else {
        if (browser !== globalBrowser) {
          console.warn('[PuppeteerLogin] Provided existing browser instance is different from globally managed one, or no global page. Will create a new page.');
        }
        // Fall through to create a new page if no valid global page or if browsers mismatch significantly
      }
      if (!page || page.isClosed()) {
        console.warn('[PuppeteerLogin] Page is missing, closed, or not suitable. Creating new page for the existing browser.');
        page = await browser.newPage();
        setBrowserPage(browser, page); // Manage this new page with the provided/existing browser
        console.log('[PuppeteerLogin] New page created and set for existing browser.');
      }
    }

    console.log('[PuppeteerLogin] Navigating to OnlyFans main page...');
    await page.goto('https://onlyfans.com/', { waitUntil: 'networkidle2', timeout: 30000 });

    const emailSelector = 'input[name="email"]';
    const passwordSelector = 'input[name="password"]';
    const loginButtonSelector = 'button[type="submit"]';

    console.log('[PuppeteerLogin] Entering credentials...');
    await page.waitForSelector(emailSelector, { timeout: 10000 });
    await page.type(emailSelector, OF_EMAIL, { delay: 50 });
    await page.waitForSelector(passwordSelector, { timeout: 10000 });
    await page.type(passwordSelector, OF_PASSWORD, { delay: 50 });

    console.log('[PuppeteerLogin] Attempting to click login button...');
    await page.click(loginButtonSelector);

    console.log('[PuppeteerLogin] Waiting for potential page transition after login click...');
    try {
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        console.log('[PuppeteerLogin] Initial page transition completed or timed out.');
    } catch (e) {
        console.warn(`[PuppeteerLogin] Initial waitForNavigation after login click failed or timed out: ${e.message}. This might be expected if page reloads quickly or CAPTCHA appears without full navigation.`);
    }

    console.log('[PuppeteerLogin] Adding a 20-second delay for page to settle and CAPTCHA to appear...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    let captchaProcessed = false;
    try {
        console.log('[PuppeteerLogin] Attempting to detect and solve CAPTCHA if present...');
        console.log('[PuppeteerLogin] Explicitly waiting for reCAPTCHA Enterprise anchor iframe...');
        const captchaIframeSelector = 'iframe[src*="recaptcha.net/recaptcha/enterprise/anchor"]';
        await page.waitForSelector(captchaIframeSelector, { visible: true, timeout: 20000 });
        console.log('[PuppeteerLogin] reCAPTCHA Enterprise anchor iframe found.');

        const iframeHandle = await page.$(captchaIframeSelector);
        if (!iframeHandle) {
            console.warn('[PuppeteerLogin] Could not get a handle to the reCAPTCHA iframe.');
        } else {
            const frame = await iframeHandle.contentFrame();
            if (!frame) {
                console.warn('[PuppeteerLogin] Could not get contentFrame from reCAPTCHA iframe handle.');
            } else {
                console.log('[PuppeteerLogin] Waiting for reCAPTCHA anchor element (checkbox) within the iframe...');
                await frame.waitForSelector('span#recaptcha-anchor', { visible: true, timeout: 15000 });
                console.log('[PuppeteerLogin] reCAPTCHA anchor element (checkbox) found within iframe.');
            }
        }
        
        console.log('[PuppeteerLogin] Proceeding to page.solveRecaptchas()...');
        const solveResult = await page.solveRecaptchas();
        console.log('[PuppeteerLogin] page.solveRecaptchas() completed. Details:', JSON.stringify(solveResult));
        if (solveResult && solveResult.error) {
            console.error('[PuppeteerLogin] Error reported by page.solveRecaptchas():', solveResult.error);
        }
        if (solveResult && (solveResult.captchas.length > 0 || solveResult.solved.length > 0 || solveResult.solutions.length > 0)) {
            console.log('[PuppeteerLogin] CAPTCHA was detected or attempted by the plugin.');
            captchaProcessed = true;
        } else {
            console.log('[PuppeteerLogin] No CAPTCHAs were actively processed by the plugin.');
        }

    } catch (captchaError) {
        console.warn(`[PuppeteerLogin] Error during CAPTCHA detection/solving phase: ${captchaError.message}. This could be due to CAPTCHA not being present or other critical issues.`);
    }

    if (captchaProcessed) {
        console.log('[PuppeteerLogin] CAPTCHA was processed. Waiting for navigation after CAPTCHA solving attempt...');
        try {
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90000 });
            console.log('[PuppeteerLogin] Navigation after CAPTCHA solving attempt completed.');
        } catch (e) {
            console.warn(`[PuppeteerLogin] waitForNavigation after CAPTCHA solving attempt failed or timed out: ${e.message}. Proceeding to check for success element.`);
        }
    } else {
        console.log('[PuppeteerLogin] No CAPTCHA was processed, or an error occurred. Proceeding to check login status directly.');
        console.log('[PuppeteerLogin] Adding a brief 3-second delay before final login check as no CAPTCHA was actively processed.');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`[PuppeteerLogin] Current URL before final login check: ${page.url()}`);
    await page.waitForSelector(HOME_ELEMENT_SELECTOR, { visible: true, timeout: 90000 });
    console.log('[PuppeteerLogin] Successfully logged in: "Home" element is visible.');
    return { browser, page, success: true, error: null };

  } catch (error) {
    console.error('[PuppeteerLogin] Error during OnlyFans login flow:', error.message);
    if (page && !page.isClosed()) {
      try {
        const screenshotPath = `error_screenshot_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`[PuppeteerLogin] Screenshot taken on error: ${screenshotPath}`);
      } catch (screenshotError) {
        console.error('[PuppeteerLogin] Error taking screenshot:', screenshotError);
      }
    }
    if (!options.existingBrowser && browser) {
      await browser.close();
      browser = null; 
    }
    if (page && !page.isClosed()) {
        try { await page.close(); } catch (e) { /* ignore page close error */ }
    }
    return { browser, page: null, success: false, error: error.message };
  }
}

module.exports = { 
  loginOnlyFans, 
  checkLoginStatus,
  getBrowserPage 
};
