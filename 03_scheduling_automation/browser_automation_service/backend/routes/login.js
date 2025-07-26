const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { saveLogFiles } = require('../utils/logger');
const { sendWebhook } = require('../utils/notifier');

puppeteer.use(StealthPlugin());
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password, userId = 'default', webhook } = req.body;
  const timestamp = new Date().toISOString();
  const logFolder = `${userId}/${timestamp.replace(/[:.]/g, '-')}`;
  let browser, page;

  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    page = await browser.newPage();
    await page.goto('https://onlyfans.com/login', { waitUntil: 'domcontentloaded' });

    const isCaptcha = await page.$('[id*="challenge"], iframe[src*="captcha"]');
    if (isCaptcha) throw new Error('CAPTCHA detected');

    await page.type('input[name="email"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    const finalUrl = page.url();
    const html = await page.content();
    const screenshot = await page.screenshot({ encoding: 'base64' });

    const meta = {
      timestamp,
      status: finalUrl.includes('home') ? 'success' : 'unknown',
      finalUrl,
      error: null,
      captchaDetected: false
    };

    await saveLogFiles(logFolder, { html, screenshot, meta });
    if (webhook) await sendWebhook(webhook, meta);

    res.json({ success: true, meta });
  } catch (err) {
    const html = page && !page.isClosed() ? await page.content() : '';
    const screenshot = page && !page.isClosed() ? await page.screenshot({ encoding: 'base64' }) : null;

    const meta = {
      timestamp,
      status: 'error',
      finalUrl: page?.url() || null,
      error: err.message,
      captchaDetected: err.message.toLowerCase().includes('captcha')
    };

    await saveLogFiles(logFolder, { html, screenshot, meta });
    if (webhook) await sendWebhook(webhook, meta);

    res.status(500).json({ success: false, meta });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = router;