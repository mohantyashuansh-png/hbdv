const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  await page.goto('file:///C:/Users/Ashutosh/Desktop/New folder/index.html');
  await page.waitForTimeout(1000);
  console.log("Checking if button works...");
  try {
    await page.click('#btn-start-game');
    console.log("Clicked successfully");
  } catch (e) {
    console.log("Click failed:", e.message);
  }
  await page.waitForTimeout(500);
  await browser.close();
})();
