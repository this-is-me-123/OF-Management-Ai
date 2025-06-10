const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');

async function takeScreenshot(pageInstance, label, baseDir = '/tmp') {
    console.log(`[takeScreenshot] Entered for label: ${label}`);
    if (!pageInstance || pageInstance.isClosed()) {
        console.warn(`[takeScreenshot] Page not available or closed for label: ${label}.`);
        return null;
    }
    const screenshotDir = baseDir;
    const screenshotPath = path.join(screenshotDir, `${label}_${Date.now()}.png`);
    try {
        await pageInstance.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`[takeScreenshot] Screenshot saved to ${screenshotPath}`);
        return screenshotPath;
    } catch (err) {
        console.error(`[takeScreenshot] Error taking screenshot for ${label}: ${err.message}`);
        return null;
    }
}

// Apply StealthPlugin
puppeteer.use(StealthPlugin());

// Apply RecaptchaPlugin (will use TWOCAPTCHA_API_KEY from env)
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_API_KEY, // Explicitly use the env var
    },
    visualFeedback: true, // Shows solving attempts in the browser for debugging
  })
);

// Only require puppeteer-core if in a Docker environment that bundles Chromium
// let puppeteerLaunchSource = puppeteer; // Default to puppeteer-extra. This was a bit confusing.
// We always use puppeteer.launch from puppeteer-extra to ensure plugins are active.
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log('[PuppeteerLogin] PUPPETEER_EXECUTABLE_PATH is set. Puppeteer-extra will use puppeteer-core with this path.');
} else {
    console.log('[PuppeteerLogin] PUPPETEER_EXECUTABLE_PATH not set. Puppeteer-extra will use its bundled Chromium (full puppeteer).');
}

const LOGIN_URL = 'https://onlyfans.com/';
const MAX_LOGIN_ATTEMPTS = 2; 
let loginAttemptCount = 0;

// The inject.js script has been disabled as it conflicts with the recaptcha plugin.
// // Load the inject.js script content
// const injectJsPath = path.join(__dirname, 'inject.js');
// let preloadFile = '';
// try {
//     preloadFile = fs.readFileSync(injectJsPath, 'utf8');
//     console.log('[PuppeteerLogin] inject.js loaded successfully.');
// } catch (err) {
//     console.error('[PuppeteerLogin] CRITICAL: Failed to load inject.js. Turnstile solving will fail.', err);
// }

let _browserInstance = null;
let _pageInstance = null;

function setBrowserPage(browser, page) {
  _browserInstance = browser;
  _pageInstance = page;
}

function getBrowserPage() {
  return { browser: _browserInstance, page: _pageInstance };
}

async function closeBrowser() {
    console.log('[PuppeteerLogin] closeBrowser called.');
    if (_browserInstance) {
        try {
            console.log('[PuppeteerLogin] Attempting to close browser instance.');
            await _browserInstance.close();
            console.log('[PuppeteerLogin] Browser instance closed successfully.');
        } catch (e) {
            console.error('[PuppeteerLogin] Error closing browser instance:', e);
        }
        _browserInstance = null;
        _pageInstance = null; 
    }
}

async function loginOnlyFans(username, password, options = {}) {
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'; // Define userAgent here (Updated to actual container Chrome version)
    loginAttemptCount++;
    console.log(`[PuppeteerLogin] Entering loginOnlyFans function. Attempt: ${loginAttemptCount}/${MAX_LOGIN_ATTEMPTS}. CODE VERSION: V6_RECAPTCHA_ONLY`);

    // Use options.existingBrowser if provided, otherwise check _browserInstance
    const browserToUse = options.existingBrowser || _browserInstance;
    if (!browserToUse || !browserToUse.isConnected()) {
        console.log('[PuppeteerLogin] No existing browser or disconnected. Launching new browser...');
        const launchOptions = {
            headless: false, // Must be false to run in Xvfb
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage', // Essential for Docker
                '--disable-blink-features=AutomationControlled',
                `--user-agent=${userAgent}`
            ],
        };
        // console.log('[PuppeteerLogin] Temporarily disabling proxy for testing.');
        // if (options.proxy && options.proxy.ip && options.proxy.port) {
        //     launchOptions.args.push('--proxy-server=' + options.proxy.ip + ':' + options.proxy.port);
        //     console.log(`[PuppeteerLogin] Using proxy: ${options.proxy.ip}:${options.proxy.port}`);
        // }
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            console.log(`[PuppeteerLogin] Using executablePath: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }
        console.log('[PuppeteerLogin] Effective browser launch arguments:', JSON.stringify(launchOptions.args));
        try {
            _browserInstance = await puppeteer.launch(launchOptions);
            console.log('[PuppeteerLogin] Puppeteer browser launched.');
            const page = await _browserInstance.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'platform', {
                    get: () => 'Linux x86_64',
                });
            });
            console.log('[PuppeteerLogin] Spoofed navigator.platform to "Linux x86_64".');
            _pageInstance = page;
            setBrowserPage(_browserInstance, _pageInstance); // Use the setter
            console.log('[PuppeteerLogin] New page created, viewport set to 1920x1080, and instance set globally via setBrowserPage.');
        } catch (launchError) {
            console.error('[PuppeteerLogin] CRITICAL: Failed to launch browser:', launchError);
            throw launchError; 
        }
    } else {
        console.log('[PuppeteerLogin] Using existing browser instance (passed via options or global).');
        _browserInstance = browserToUse; // Ensure global _browserInstance is set to the one we are using
        if (!_pageInstance || _pageInstance.isClosed()) {
            console.log('[PuppeteerLogin] No existing global page or page is closed. Creating new page.');
            _pageInstance = await _browserInstance.newPage();
            setBrowserPage(_browserInstance, _pageInstance);
            console.log('[PuppeteerLogin] New page created and set globally via setBrowserPage.');
            // console.log('[PuppeteerLogin] Request interception enabled.'); // This was misleading as setRequestInterception(true) is not called.

            /* Request interception is currently NOT active because await _pageInstance.setRequestInterception(true) is not called.
               The following handler would only become active if setRequestInterception(true) is added back.
            _pageInstance.on('request', async req => { // Make the handler async
                const earlyUrl = req.url(); // Get URL at the very start
                console.log(`[PuppeteerLogin] INTERCEPT_HANDLER_ENTRY: URL: ${earlyUrl}, ResourceType: ${req.resourceType()}`);

                if (req.isInterceptResolutionHandled()) {
                    // console.log(`[PuppeteerLogin] INTERCEPT: Request already handled or being handled: ${req.url()}`);
                    return;
                }

                const url = req.url();
                const resourceType = req.resourceType();

                const captchaDomains = ['recaptcha.net', 'gstatic.com/recaptcha', 'ak.staticimg.net/shared/recaptcha', 'hcaptcha.com', 'cloudflare.com/cf-challenge'];
                const isCaptchaUrl = captchaDomains.some(domain => url.includes(domain));

                const analyticsDomainsToBlock = ['google-analytics.com', 'google.com/ccm/collect', 'facebook.net/tr', 'tiktok.com/api/v2/event', 'ads-twitter.com', 'bat.bing.com'];
                const isAnalyticsUrlToBlock = analyticsDomainsToBlock.some(domain => url.includes(domain));
                
                const generallyBlockedResourceTypes = new Set(['image', 'stylesheet', 'font', 'media', 'other', 'manifest', 'preflight']);

                try {
                    if (isCaptchaUrl) {
                        console.log(`[PuppeteerLogin] INTERCEPT: CAPTCHA domain detected for URL: ${url}. ResourceType: ${resourceType}. Attempting to continue.`);
                        try {
                            await req.continue();
                            console.log(`[PuppeteerLogin] INTERCEPT: Successfully continued CAPTCHA request: ${url}`);
                        } catch (continueError) {
                            console.error(`[PuppeteerLogin] INTERCEPT: CRITICAL - Error calling req.continue() for CAPTCHA URL ${url}: ${continueError.message}`);
                        }
                    } else if (isAnalyticsUrlToBlock) {
                        await req.abort('blockedbyclient');
                    } else if (generallyBlockedResourceTypes.has(resourceType) && !url.includes('onlyfans.com')) {
                        await req.abort('blockedbyclient');
                    } else {
                        await req.continue();
                    }
                } catch (e) {
                    if (e.message && !e.message.toLowerCase().includes('request is already handled') && !e.message.toLowerCase().includes('request context is destroyed')) {
                        console.warn(`[PuppeteerLogin] INTERCEPT: Error handling request ${url}: ${e.message}`);
                    }
                }
            });
            */
        } else {
            console.log('[PuppeteerLogin] Using existing page instance.');
        }
    }

    const page = _pageInstance;

    // --- Consolidated Page Setup Start ---
    // DISABLING REQUEST INTERCEPTION - This is a likely source of bot detection.
    // await page.setRequestInterception(true);
    // console.log('[PuppeteerLogin] Request interception enabled.');

    // page.on('request', req => {
    //     const url = req.url();
    //     if (/(google-analytics\.com|google\.com\/ccm\/collect)/.test(url)) { // Allow recaptcha.net, only abort analytics
    //         // console.log(`[PuppeteerLogin] Aborting request: ${url}`); // Optional: for debugging
    //         req.abort().catch(e => console.warn(`[PuppeteerLogin] Error aborting request ${url}: ${e.message}` ));
    //     } else {
    //         req.continue().catch(e => console.warn(`[PuppeteerLogin] Error continuing request ${url}: ${e.message}` ));
    //     }
    // });

    await page.setUserAgent(userAgent);
    console.log(`[PuppeteerLogin] User-Agent explicitly set to: ${userAgent}`);
    await page.setExtraHTTPHeaders({
        'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',
        'sec-ch-ua-arch': '"x86"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version': '"125.0.0.0"',
        'sec-ch-ua-full-version-list': '"Google Chrome";v="125.0.0.0", "Chromium";v="125.0.0.0", "Not/A)Brand";v="24.0.0.0"',
        'sec-ch-ua-model': '""',
    });
    console.log('[PuppeteerLogin] Set extra HTTP headers for client hints.');

    // await page.evaluateOnNewDocument(preloadFile);
    // console.log('[PuppeteerLogin] Evaluating inject.js on new document...');
    // Removed the execution of inject.js

    console.log('[PuppeteerLogin] Setting up page event listeners for debugging...');
    page.removeAllListeners('console'); // Remove any old listeners

    page.on('pageerror', (error) => console.log(`[Browser PAGEERROR] ${error.message}`));
    await page.setBypassCSP(true);
    console.log('[PuppeteerLogin] Content Security Policy bypassed.');
    page.on('requestfailed', req => {
        const url = req.url();
        const errorText = req.failure() ? req.failure().errorText : 'N/A';
        // Ignore aborted requests we deliberately stopped
        if (errorText === 'net::ERR_ABORTED' && /(google-analytics\.com|google\.com\/ccm\/collect)/.test(url)) { // Only ignore our explicit aborts for analytics
            // console.log(`[PuppeteerLogin] Ignored aborted request (expected): ${url}`); // Optional: for debugging
            return; 
        }
        // Log other failures
        console.warn(`[Browser REQUESTFAILED] Details: ${JSON.stringify({
            url: url,
            method: req.method(),
            headers: req.headers(),
            resourceType: req.resourceType(),
            redirectChain: req.redirectChain().map(r => r.url()),
            errorText: errorText,
            failureDetails: req.failure() 
        }, null, 2)}`);
    });

    const usernameSelector = 'input[name="email"]'; // Changed from username to email based on page structure
    const passwordSelector = 'input[name="password"]';
    const loginButtonSelector = 'button[type="submit"]'; 
    const successSelector = 'a[href="/my/settings"]'; 
    const failureSelectorEmail = '.b-server-error'; 
    const failureSelectorCaptcha = '.g-recaptcha'; // General reCAPTCHA class, good for detection
    const recaptchaV2IframeSelector = 'iframe[src*="recaptcha.net"][src*="enterprise"]'; // Targets enterprise reCAPTCHA from recaptcha.net


    try { // Main try block for the entire login attempt sequence
        if (options.proxy && options.proxy.username && options.proxy.password) {
        console.log('[PuppeteerLogin] Authenticating proxy for page...');
        await page.authenticate({ username: options.proxy.username, password: options.proxy.password });
        console.log('[PuppeteerLogin] Proxy authentication for page successful.');
    }

    console.log(`[PuppeteerLogin] Navigating to ${LOGIN_URL} (waitUntil: domcontentloaded)...`);
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log(`[PuppeteerLogin] Successfully navigated to ${LOGIN_URL} (waitUntil: domcontentloaded).`);
        console.log(`[PuppeteerLogin] Waiting for email input field: ${usernameSelector} (90s timeout)`);
        await page.waitForSelector(usernameSelector, { visible: true, timeout: 90000 });
        console.log('[PuppeteerLogin] Email input field found. Typing email/username...');
        await page.type(usernameSelector, username, { delay: 110 + Math.random() * 50 });

        console.log('[PuppeteerLogin] Waiting for password input field...');
        await page.waitForSelector(passwordSelector, { visible: true, timeout: 10000 });
        console.log('[PuppeteerLogin] Password input field found. Typing password...');
        await page.type(passwordSelector, password, { delay: 125 + Math.random() * 50 });

        console.log('[PuppeteerLogin] Clicking login button...');
        await page.evaluate(selector => document.querySelector(selector).click(), loginButtonSelector);

        console.log('[PuppeteerLogin] Login button clicked. Adding delay and waiting for potential reCAPTCHA Enterprise iframe...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second fixed delay

        try {
            console.log(`[PuppeteerLogin] Waiting for reCAPTCHA Enterprise iframe (${recaptchaV2IframeSelector}) to appear (max 30s)...`);
            await page.waitForSelector(recaptchaV2IframeSelector, { visible: true, timeout: 30000 });
            console.log('[PuppeteerLogin] reCAPTCHA Enterprise iframe detected. Proceeding to solve.');
        } catch (e) {
            console.log('[PuppeteerLogin] reCAPTCHA Enterprise iframe not found or timed out. Will attempt solveRecaptchas anyway, in case of other CAPTCHA types or no CAPTCHA.');
        }

        console.log('[PuppeteerLogin] Attempting to solve any CAPTCHAs that appear (reCAPTCHA)...');
        try {
            const { solved, error } = await page.solveRecaptchas();
            if (solved && solved.length > 0) {
                console.log(`[PuppeteerLogin] CAPTCHA solved successfully by plugin: ${JSON.stringify(solved)}`);
            } else if (error) {
                console.log(`[PuppeteerLogin] CAPTCHA could not be solved by plugin: ${error}`);
            } else {
                console.log('[PuppeteerLogin] No CAPTCHA found or solving was not required.');
            }
        } catch (err) {
            console.warn(`[PuppeteerLogin] An error occurred during solveRecaptchas(): ${err.message}. This might be okay if no CAPTCHA was present. Continuing...`);
        }

        console.log('[PuppeteerLogin] Waiting for final login success signal (home icon) after CAPTCHA check...');
        await page.waitForSelector('svg[data-icon-name="icon-home"]', { timeout: 120000 });
        console.log('[PuppeteerLogin] Login successful: Home icon found.');
        loginAttemptCount = 0; // Reset on success
        return { success: true, browser: _browserInstance, page };
    } catch (error) {
        console.error('[PuppeteerLogin] CRITICAL ERROR in loginOnlyFans:', error.message);
        console.error('[PuppeteerLogin] Stack:', error.stack);
        if (page && !page.isClosed()) {
            try {
                console.log('[PuppeteerLogin] Attempting screenshot in CRITICAL_ERROR catch via top-level takeScreenshot.');
                const errorLabel = `critical_error_${Date.now()}`;
                const pageUrlAtError = page.url();
                const htmlContentPath = path.join('/tmp', `page_content_${errorLabel}.html`);
                const screenshotPath = path.join('/tmp', `screenshot_${errorLabel}.png`);
                
                fs.writeFileSync(htmlContentPath, await page.content());
                console.log(`[PuppeteerLogin] Full page HTML content saved to: ${htmlContentPath} (URL: ${pageUrlAtError})`);
                await takeScreenshot(page, `error_screenshot_${errorLabel}`); 

            } catch (screenshotError) {
                console.error('[PuppeteerLogin] Error capturing details in CRITICAL_ERROR catch:', screenshotError.message);
            }
        }
        if (loginAttemptCount >= MAX_LOGIN_ATTEMPTS) {
            console.error(`[PuppeteerLogin] Max login attempts (${MAX_LOGIN_ATTEMPTS}) reached. Aborting and closing browser.`);
            await closeBrowser(); 
        }
        throw error; 
    }
}

module.exports = { loginOnlyFans, getBrowserPage, setBrowserPage, closeBrowser };
