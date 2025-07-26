// backend/puppeteerJob.js
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
puppeteer.use(StealthPlugin());

export async function runPuppeteerJob(folder) {
  // Ensure debug folder under backend/debug_logs/Logs/<folder>/
  const baseDebugDir = path.join(__dirname, "debug_logs", "Logs");
  const debugDir = path.join(baseDebugDir, folder);
  console.log("⏺️  Debug dumps will go to", debugDir);
  fs.mkdirSync(debugDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Use a realistic UA
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );

  try {
    // 1) Load login form
    await page.goto("https://onlyfans.com/?return_to=%2Flogin", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await page.waitForSelector("form.b-loginreg__form", { timeout: 60000 });
    await page.waitForSelector("input[name='email']", { timeout: 60000 });

    // 2) Type credentials
    await page.type("input[name='email']", process.env.OF_EMAIL, { delay: 50 });
    await page.type("input[name='password']", process.env.OF_PASSWORD, { delay: 50 });

    // 3) Submit and wait (SPA-safe)
    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 })
        .catch(() => {})
    ]);

    // 4) Capture artifacts
    const finalUrl = page.url();
    const cookies = await page.cookies();
    const screenshotBase64 = await page.screenshot({ encoding: "base64", fullPage: true });
    const htmlContent = await page.content();
    const htmlSnippet = htmlContent.slice(0, 1024);

    await browser.close();

    return { finalUrl, cookies, screenshotBase64, htmlSnippet };
  } catch (err) {
    // Dump full HTML + screenshot on failure
    try {
      const html = await page.content();
      fs.writeFileSync(path.join(debugDir, "no_email_input_page.html"), html, "utf-8");
    } catch (e) {
      console.error("Failed HTML dump:", e);
    }
    try {
      await page.screenshot({
        path: path.join(debugDir, "no_email_input_page.png"),
        fullPage: true,
      });
    } catch (e) {
      console.error("Failed screenshot dump:", e);
    }

    await browser.close();
    throw new Error(
      `Login flow failed (no email input). Debug files in ${debugDir}: ${err.message}`
    );
  }
}
