import { chromium } from 'playwright';

async function generatePreview() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the preview server
  // Note: In CI this runs against the 'preview' build on port 4173
  try {
    console.log('Navigating to http://localhost:4173...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });

    // Wait for critical content
    await page.waitForSelector('main', { timeout: 10000 });

    // Take screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'preview.png', fullPage: true });
    console.log('Screenshot saved to preview.png');
  } catch (error) {
    console.error('Error generating preview:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generatePreview();
