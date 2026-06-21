const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('api') && !url.includes('endpoints')) {
      console.log(`[API] ${response.status()} ${url}`);
    }
  });

  try {
    console.log("Navigating to pos.elektraweb.com...");
    await page.goto('https://pos.elektraweb.com/', { waitUntil: 'networkidle' });
    
    // Step 1
    await page.waitForSelector('input[name="tenantNo"]', { timeout: 10000 });
    console.log("Step 1: Login...");
    await page.fill('input[name="tenantNo"]', '31746');
    await page.fill('input[name="userCode"]', 'Arn5');
    await page.fill('input[name="hotelPassword"]', 'Areena2026++');
    await page.click('button.login-btn');

    // Step 2
    console.log("Step 2: Pin...");
    await page.waitForSelector('input[name="waiterPassword"]', { timeout: 10000 });
    await page.fill('input[name="waiterPassword"]', '47994799');
    await page.click('button.w-login-btn');

    // Step 3: Wait for departments or main screen
    console.log("Step 3: Department selection or main screen...");
    await page.waitForTimeout(4000);
    
    // Look for Arn1
    const locators = await page.getByText('Arn1', { exact: false }).all();
    if (locators.length > 0) {
       console.log("Found Arn1! Clicking it...");
       await locators[0].click();
       await page.waitForTimeout(3000);
    } else {
       console.log("Could not find Arn1 text on screen. Maybe we are already in? Taking screenshot.");
    }

    await page.screenshot({ path: 'scratch/step3_main.png' });
    fs.writeFileSync('scratch/step3_main.html', await page.content());

  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await browser.close();
  }
})();
