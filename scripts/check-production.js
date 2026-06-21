const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1280, height: 800 });

  try {
    console.log('Navigating to login page...');
    await page.goto('https://areenapro.com/program/', { waitUntil: 'networkidle' });
    
    // Check if we are redirected to a login form
    console.log('Current URL:', page.url());
    
    console.log('Entering credentials...');
    const adiSelector = 'input[name="adi"]';
    const passSelector = 'input[name="pass"]';
    await page.fill(adiSelector, 'oguzhan');
    await page.fill(passSelector, '969155');
    
    console.log('Submitting login form via button click...');
    // Click the submit button directly
    await page.click('button[type="submit"]');
    
    // Wait for either the URL to change/redirect or standard load state
    console.log('Waiting for navigation to complete...');
    await page.waitForTimeout(5000); // Allow redirect to process
    
    console.log('Post-login URL:', page.url());
    
    // Save page HTML for debug if needed
    const htmlContent = await page.content();
    fs.writeFileSync('scratch_login_result.html', htmlContent);
    
    // Check if we logged in successfully
    const hasSidebar = await page.$('.page-sidebar-menu') || await page.$('text=Sistemler');
    if (!hasSidebar && (htmlContent.includes('Hatalı') || htmlContent.includes('Şifre') || htmlContent.includes('Kullanıcı Adı ve Şifreyi Giriniz'))) {
      console.log('Login failed. Please check credentials or page output.');
      await page.screenshot({ path: 'login_failure.png' });
      console.log('Screenshot saved to login_failure.png');
      return;
    }
    
    console.log('Logged in successfully!');
    
    // Capture the dashboard screenshot
    const artifactDir = '/Users/oguzhankaya/.gemini/antigravity/brain/e5640a47-a6b7-4817-889d-78c0af1bc4b6';
    fs.mkdirSync(artifactDir, { recursive: true });
    
    const dashboardPath = path.join(artifactDir, 'media__production_dashboard.png');
    await page.screenshot({ path: dashboardPath, fullPage: true });
    console.log('Dashboard screenshot saved to:', dashboardPath);

    // Let's navigate to system.asp
    console.log('Navigating to sistem.asp...');
    await page.goto('https://areenapro.com/program/sistem.asp', { waitUntil: 'networkidle' });
    const sistemPath = path.join(artifactDir, 'media__production_sistem.png');
    await page.screenshot({ path: sistemPath, fullPage: true });
    console.log('Sistem page screenshot saved to:', sistemPath);

    // Let's navigate to PDKS
    console.log('Navigating to PDKS page...');
    await page.goto('https://areenapro.com/program/pdks/giris_cikis.asp', { waitUntil: 'networkidle' }).catch(e => console.log('PDKS failed to navigate:', e.message));
    const pdksPath = path.join(artifactDir, 'media__production_pdks.png');
    await page.screenshot({ path: pdksPath, fullPage: true });
    console.log('PDKS page screenshot saved to:', pdksPath);

    // Let's navigate to Kasa
    console.log('Navigating to Kasa page...');
    await page.goto('https://areenapro.com/program/kasa/kasadefteri.asp', { waitUntil: 'networkidle' }).catch(e => console.log('Kasa failed to navigate:', e.message));
    const kasaPath = path.join(artifactDir, 'media__production_kasa.png');
    await page.screenshot({ path: kasaPath, fullPage: true });
    console.log('Kasa page screenshot saved to:', kasaPath);

  } catch (error) {
    console.error('An error occurred during execution:', error);
    await page.screenshot({ path: 'error_screenshot.png' });
    console.log('Error screenshot saved to error_screenshot.png');
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
