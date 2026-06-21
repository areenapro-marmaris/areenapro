const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('api') && !url.includes('endpoints')) {
      console.log(`[API RESPONSE] ${response.status()} ${url}`);
      try {
         if(response.headers()['content-type']?.includes('application/json')){
            const data = await response.json();
            fs.writeFileSync(`scratch/req_${Date.now()}.json`, JSON.stringify(data, null, 2));
         }
      } catch(e){}
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

    // Step 3
    console.log("Step 3: Department...");
    await page.waitForTimeout(4000);
    const arn1Locators = await page.getByText('Arn1', { exact: false }).all();
    if (arn1Locators.length > 0) {
       await arn1Locators[0].click();
    }
    
    await page.waitForTimeout(5000);
    
    // Find 3 dots. Usually it's mat-icon that contains 'more_vert'.
    console.log("Looking for 3 dots...");
    const threeDots = await page.getByText('more_vert', { exact: false }).first();
    if (threeDots) {
        await threeDots.click();
    } else {
        // Just click any button in the top right, or find by id/class
        console.log("Could not find more_vert, dumping html to debug.");
        fs.writeFileSync('scratch/step4_failed_dots.html', await page.content());
        return;
    }

    await page.waitForTimeout(2000);
    console.log("Clicking Raporlar...");
    await page.getByText('Raporlar', { exact: false }).click();
    await page.waitForTimeout(2000);

    console.log("Clicking Genel X Raporu...");
    await page.getByText('Genel X Raporu', { exact: false }).click();
    await page.waitForTimeout(2000);

    console.log("Checking for password prompt...");
    // if there is an input for password
    const pwdInputs = await page.$$('input[type="password"]');
    if (pwdInputs.length > 0) {
        console.log("Entering report password...");
        await pwdInputs[0].fill('155148');
        // Click OK
        const okBtn = await page.getByText('OK', { exact: false }).first();
        if (okBtn) await okBtn.click();
    }

    await page.waitForTimeout(2000);
    console.log("Clicking Raporla...");
    
    // Start waiting for download before clicking.
    const [ download ] = await Promise.all([
       page.waitForEvent('download', { timeout: 10000 }).catch(() => console.log("No download event.")),
       page.getByText('Raporla', { exact: false }).first().click()
    ]);
    
    if (download) {
       console.log("Download started!");
       await download.saveAs('scratch/rapor.pdf');
    }
    
    await page.waitForTimeout(5000);
    console.log("Done. Checking what we got.");

  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await browser.close();
  }
})();
