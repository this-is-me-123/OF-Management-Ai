const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { Solver } = require('@2captcha/captcha-solver');
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
// puppeteer.use(StealthPlugin());

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

// Initialize 2Captcha Solver
let solver;
if (process.env.TWOCAPTCHA_API_KEY) {
    console.log('[PuppeteerLogin] Initializing 2Captcha Solver for Turnstile.');
    solver = new Solver(process.env.TWOCAPTCHA_API_KEY);
} else {
    console.warn('[PuppeteerLogin] TWOCAPTCHA_API_KEY not found. Turnstile CAPTCHAs will not be solved.');
}

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

// Load the inject.js script content
const injectJsPath = path.join(__dirname, 'inject.js');
let preloadFile = '';
try {
    preloadFile = fs.readFileSync(injectJsPath, 'utf8');
    console.log('[PuppeteerLogin] inject.js loaded successfully.');
} catch (err) {
    console.error('[PuppeteerLogin] CRITICAL: Failed to load inject.js. Turnstile solving will fail.', err);
}

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
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.68 Safari/537.36'; // Define userAgent here (Updated to actual container Chrome version)
    loginAttemptCount++;
    console.log(`[PuppeteerLogin] Entering loginOnlyFans function. Attempt: ${loginAttemptCount}/${MAX_LOGIN_ATTEMPTS}. CODE VERSION: V5_TURNSTILE`);

    // Use options.existingBrowser if provided, otherwise check _browserInstance
    const browserToUse = options.existingBrowser || _browserInstance;
    if (!browserToUse || !browserToUse.isConnected()) {
        console.log('[PuppeteerLogin] No existing browser or disconnected. Launching new browser...');
        const launchOptions = {
            headless: options.headless !== undefined ? (options.headless ? 'new' : false) : 'new', // Default to 'new' if not specified in options
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
                `--user-agent=${userAgent}`
            ],
        };
        if (options.proxy && options.proxy.ip && options.proxy.port) {
            launchOptions.args.push('--proxy-server=' + options.proxy.ip + ':' + options.proxy.port);
            console.log(`[PuppeteerLogin] Using proxy: ${options.proxy.ip}:${options.proxy.port}`);
        }
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            console.log(`[PuppeteerLogin] Using executablePath: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }
        console.log('[PuppeteerLogin] Effective browser launch arguments:', JSON.stringify(launchOptions.args));
        try {
            _browserInstance = await puppeteer.launch(launchOptions);
            console.log('[PuppeteerLogin] Puppeteer browser launched.');
            _pageInstance = (await _browserInstance.pages())[0] || await _browserInstance.newPage();
            setBrowserPage(_browserInstance, _pageInstance); // Use the setter
            console.log('[PuppeteerLogin] New page created and set globally via setBrowserPage.');
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
    await page.setRequestInterception(true);
    console.log('[PuppeteerLogin] Request interception enabled.');

    page.on('request', req => {
        const url = req.url();
        if (/(google-analytics\.com|google\.com\/ccm\/collect)/.test(url)) { // Allow recaptcha.net, only abort analytics
            // console.log(`[PuppeteerLogin] Aborting request: ${url}`); // Optional: for debugging
            req.abort().catch(e => console.warn(`[PuppeteerLogin] Error aborting request ${url}: ${e.message}` ));
        } else {
            req.continue().catch(e => console.warn(`[PuppeteerLogin] Error continuing request ${url}: ${e.message}` ));
        }
    });

    await page.setExtraHTTPHeaders({
        'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',
        'sec-ch-ua-arch': '"x86"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version': '"137.0.7151.68"',
        'sec-ch-ua-full-version-list': '"Google Chrome";v="137.0.7151.68", "Chromium";v="137.0.7151.68", "Not/A)Brand";v="24.0.0.0"',
        'sec-ch-ua-model': '""',
    });
    console.log('[PuppeteerLogin] Set extra HTTP headers for client hints.');

    if (preloadFile) {
        console.log('[PuppeteerLogin] Evaluating inject.js on new document...');
        await page.evaluateOnNewDocument(preloadFile);
    }
    // --- Consolidated Page Setup End ---

    console.log('[PuppeteerLogin] Setting up page event listeners for debugging...');
    page.removeAllListeners('console'); // Remove any old listeners
    page.on('console', async (msg) => {
        const msgType = msg.type().toUpperCase();
        const msgText = msg.text();
        // console.log(`[Browser CONSOLE ${msgType}] ${msgText}`); // Temporarily commented out for debugging log noise
        if (msgText.includes('intercepted-params:')) {
            if (!solver) {
                console.error('[PuppeteerLogin] Turnstile intercepted but 2Captcha solver not initialized (TWOCAPTCHA_API_KEY missing).');
                return;
            }
            try {
                const params = JSON.parse(msgText.replace('intercepted-params:', ''));
                console.log('[PuppeteerLogin] Intercepted Turnstile params:', JSON.stringify(params));
                console.log('[PuppeteerLogin] Attempting to solve Cloudflare Turnstile...');
                const result = await solver.cloudflareTurnstile(params);
                console.log('[PuppeteerLogin] Turnstile solved by 2Captcha. Token:', result.data ? result.data.substring(0, 20) + '...' : 'NO_TOKEN_RECEIVED');
                if (result.data) {
                    await page.evaluate((token) => {
                        if (window.cfCallback) {
                            console.log('[Browser Script] Calling cfCallback with token.');
                            window.cfCallback(token);
                        } else {
                            console.error('[Browser Script] cfCallback not found on window.');
                        }
                    }, result.data);
                } else {
                    console.error('[PuppeteerLogin] 2Captcha did not return a token for Turnstile.');
                }
            } catch (e) {
                console.error('[PuppeteerLogin] Error solving Turnstile or calling callback:', e);
            }
        }
    });
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
    const turnstileIframeSelector = 'iframe[src*="challenges.cloudflare.com"]';

    try { // Main try block for the entire login attempt sequence
        if (options.proxy && options.proxy.username && options.proxy.password) {
        console.log('[PuppeteerLogin] Authenticating proxy for page...');
        await page.authenticate({ username: options.proxy.username, password: options.proxy.password });
        console.log('[PuppeteerLogin] Proxy authentication for page successful.');
    }

    console.log(`[PuppeteerLogin] Navigating to ${LOGIN_URL} (waitUntil: networkidle0)...`);
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle0', timeout: 90000 });
    console.log(`[PuppeteerLogin] Successfully navigated to ${LOGIN_URL} (waitUntil: networkidle0).`);
        console.log(`[PuppeteerLogin] Waiting for email input field: ${usernameSelector} (90s timeout)`);
        await page.waitForSelector(usernameSelector, { visible: true, timeout: 90000 });
        console.log('[PuppeteerLogin] Email input field found. Typing email/username...');
        await page.type(usernameSelector, username, { delay: 100 + Math.random() * 50 });

        console.log('[PuppeteerLogin] Waiting for password input field...');
        await page.waitForSelector(passwordSelector, { visible: true, timeout: 10000 });
        console.log('[PuppeteerLogin] Password input field found. Typing password...');
        await page.type(passwordSelector, password, { delay: 100 + Math.random() * 50 });

        console.log('[PuppeteerLogin] Clicking login button...');
        await page.click(loginButtonSelector);

        console.log('[PuppeteerLogin] Waiting for post-login signal (e.g., user avatar) (max 120s)...');
        try {
            await page.waitForSelector('img.g-avatar', { timeout: 120000 });
            console.log('[PuppeteerLogin] Login successful: User avatar found.');
            loginAttemptCount = 0; // Reset on success
            return { success: true, browser: _browserInstance, page };
        } catch (e) {
            console.warn('[PuppeteerLogin] User avatar not found within timeout. Proceeding to check for CAPTCHA or errors.');
            // This is not necessarily an error yet, could be a CAPTCHA page.
        }

        // If avatar not found, check for specific failure messages or CAPTCHAs
        console.log('[PuppeteerLogin] Checking for CAPTCHA or specific error messages...');
        const isFailureEmail = await page.$(failureSelectorEmail);
        const isFailureCaptcha = await page.$(failureSelectorCaptcha);
        const isRecaptchaV2 = await page.$(recaptchaV2IframeSelector);
        const isTurnstile = await page.$(turnstileIframeSelector);

        // Scenario 1: Direct success (already handled by avatar check)
        // The following block using successSelector is legacy and commented out as avatar check is primary.
        /*
        if (await page.$(successSelector)) {
            console.log('[PuppeteerLogin] Login successful on first attempt (found settings link).');
            loginAttemptCount = 0;
            return { success: true, browser: _browserInstance, page };
        }
        */

        // NEW: Check for "Unable to load captcha" modal
        const unableToLoadCaptchaModalText = "Unable to load captcha. Please try again later.";
        const isUnableToLoadCaptchaVisible = await page.evaluate((text) => {
            const elements = Array.from(document.querySelectorAll('*'));
            return elements.some(el => el.textContent && el.textContent.includes(text));
        }, unableToLoadCaptchaModalText);

        if (isUnableToLoadCaptchaVisible) {
            console.error(`[PuppeteerLogin] Detected 'Unable to load captcha' modal. This means CAPTCHA resources (e.g., recaptcha.net) failed to load. Ensure they are not blocked by network policies or request interception.`);
            // await takeScreenshot(page, 'unable_to_load_captcha_modal'); 
            throw new Error('Login failed: CAPTCHA mechanism failed to load. Check network/interception.');
        } else 
        // Scenario 2: Direct email/password failure
        if (await page.$(failureSelectorEmail)) {
            const errorText = await page.$eval(failureSelectorEmail, el => el.textContent.trim());
            console.error(`[PuppeteerLogin] Login failed: Email/Password error. Message: ${errorText}`);
            throw new Error(`Login failed: Email/Password error. ${errorText}`);
        }

        // Scenario 3: ReCAPTCHA v2 detected
        console.log(`[PuppeteerLogin] Checking for ReCAPTCHA. Pre-existing isFailureCaptcha (based on '${failureSelectorCaptcha}' div): ${isFailureCaptcha}`);
        let recaptchaV2IframeElement = null;
        try {
            console.log(`[PuppeteerLogin] Attempting to find reCAPTCHA iframe with selector: ${recaptchaV2IframeSelector}`);
            recaptchaV2IframeElement = await page.waitForSelector(recaptchaV2IframeSelector, { visible: true, timeout: 7000 }); // Increased timeout slightly
            if (recaptchaV2IframeElement) {
                console.log('[PuppeteerLogin] Visible reCAPTCHA v2 iframe detected via waitForSelector.');
            }
        } catch (e) {
            console.log(`[PuppeteerLogin] reCAPTCHA v2 iframe NOT detected via waitForSelector (it may be hidden or not present, or selector is wrong): ${e.message}`);
        }

        if (recaptchaV2IframeElement || isFailureCaptcha) {
            console.log('[PuppeteerLogin] ReCAPTCHA v2 detected. Adding small delay before attempting to solve...');
            await page.waitForTimeout(1500); // Small delay (1.5 seconds)
            console.log('[PuppeteerLogin] Attempting to solve ReCAPTCHA v2...');
            try {
                const { solved, error } = await page.solveRecaptchas();
                if (solved && solved.length > 0) {
                    console.log(`[PuppeteerLogin] ReCAPTCHA solved by plugin: ${JSON.stringify(solved)}. Re-clicking login button.`);
                    await page.click(loginButtonSelector); // Re-click login after CAPTCHA solve
                    console.log('[PuppeteerLogin] Waiting for login result after ReCAPTCHA solve (max 60s)...');
                    
                    const postCaptchaOutcome = await page.waitForFunction(
                        (sSel, feSel, recaptchaSel, captchaWrongText) => {
                            const successEl = document.querySelector(sSel);
                            if (successEl) return 'success';
                            const emailErrEl = document.querySelector(feSel);
                            if (emailErrEl) return 'email_error';
                            
                            const pageContent = document.body.innerText;
                            if (pageContent && pageContent.includes(captchaWrongText)) return 'captcha_wrong';

                            const recaptchaIframe = document.querySelector(recaptchaSel);
                            if (recaptchaIframe) {
                                const style = getComputedStyle(recaptchaIframe);
                                if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0 && recaptchaIframe.offsetHeight > 0 && recaptchaIframe.offsetWidth > 0) {
                                     return 'recaptcha_visible';
                                }
                            }
                            return false; // Keep waiting for a recognized state
                        },
                        { timeout: 60000 }, // 60 second timeout
                        successSelector, 
                        failureSelectorEmail, 
                        recaptchaV2IframeSelector, 
                        "Captcha wrong" // Text to search for
                    );

                    console.log(`[PuppeteerLogin] Post-CAPTCHA solve outcome: ${postCaptchaOutcome}`);

                    if (postCaptchaOutcome === 'success') {
                        console.log('[PuppeteerLogin] Login successful after ReCAPTCHA solve.');
                        loginAttemptCount = 0; // Reset on success
                        return { success: true, browser: _browserInstance, page };
                    } else if (postCaptchaOutcome === 'email_error') {
                        const errorText = await page.$eval(failureSelectorEmail, el => el.textContent.trim());
                        console.error(`[PuppeteerLogin] Login failed after ReCAPTCHA: Email/Password error. Message: ${errorText}`);
                        throw new Error(`Login failed after ReCAPTCHA: Email/Password error. ${errorText}`);
                    } else if (postCaptchaOutcome === 'captcha_wrong' || postCaptchaOutcome === 'recaptcha_visible') {
                        let message = '[PuppeteerLogin] Login failed after ReCAPTCHA: ';
                        if (postCaptchaOutcome === 'captcha_wrong') {
                            message += '"Captcha wrong" message detected.';
                        } else { // recaptcha_visible
                            message += 'ReCAPTCHA iframe became visible again.';
                        }
                        console.error(message);
                        throw new Error(message + " CAPTCHA likely failed or was rejected by OnlyFans.");
                    } else { // This means timeout from waitForFunction, or it returned an unexpected falsy value
                        console.error('[PuppeteerLogin] ReCAPTCHA solved, login clicked, but outcome unclear after 60s (timeout or unexpected state).');
                        const timestamp = Date.now();
                        await takeScreenshot(page, `error_screenshot_captcha_outcome_timeout_${timestamp}`);
                        try {
                            const pageContentOnTimeout = await page.content();
                            fs.writeFileSync(`/tmp/page_content_captcha_outcome_timeout_${timestamp}.html`, pageContentOnTimeout);
                            console.log(`[PuppeteerLogin] HTML content saved for CAPTCHA outcome timeout to /tmp/page_content_captcha_outcome_timeout_${timestamp}.html`);
                        } catch (htmlError) {
                            console.error(`[PuppeteerLogin] Failed to save HTML content for CAPTCHA outcome timeout: ${htmlError.message}`);
                        }
                        throw new Error('Login failed: Unknown state after ReCAPTCHA solve and timeout.');
                    }
                } else {
                    console.error('[PuppeteerLogin] Failed to solve ReCAPTCHA via plugin.', error || 'No solutions returned.');
                    throw new Error(`Failed to solve ReCAPTCHA. ${error || 'No solutions returned.'}`);
                }
            } catch (recaptchaSolveError) {
                console.error('[PuppeteerLogin] Error during page.solveRecaptchas() or subsequent checks:', recaptchaSolveError.message);
                // Ensure a new error is thrown to be caught by the main try-catch for retries
                throw new Error(`Error processing ReCAPTCHA solution or its outcome: ${recaptchaSolveError.message}`);
            }
        }

        // Fallback: If none of the above specific conditions were met
        console.error('[PuppeteerLogin] Login failed: Unknown page state after attempts. Initial outcome did not clearly indicate a solvable CAPTCHA or direct success/failure.');
        throw new Error('Login failed: Unknown page state after attempts.');
    // This is the end of the main try block for the login attempt logic
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
