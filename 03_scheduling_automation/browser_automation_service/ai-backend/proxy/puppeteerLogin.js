const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginOnlyFans() {
  const proxyUrl = `http://${process.env.PROXY_USER}:${process.env.PROXY_PASS}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--proxy-server=${proxyUrl}`]
  });
  const page = await browser.newPage();
  await page.authenticate({
    username: process.env.PROXY_USER,
    password: process.env.PROXY_PASS
  });
  // TODO: Implement login flow
  await browser.close();
}

module.exports = loginOnlyFans;
