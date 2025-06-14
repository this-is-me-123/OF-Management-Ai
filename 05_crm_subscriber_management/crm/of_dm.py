from playwright.sync_api import sync_playwright
import os

def send_of_dm(username, password, recipient_url, message):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://onlyfans.com/")
        page.fill("input[name='email']", username)
        page.fill("input[name='password']", password)
        page.click("button[type='submit']")
        page.wait_for_url(recipient_url)
        page.fill("textarea", message)
        page.click("button.send-message")
        browser.close()
# WARNING: Use only with test accounts! This is for demonstration only.
