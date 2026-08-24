import { chromium } from 'playwright';

// Parâmetros opcionais via env, usados para gerar screenshots de UI/UX em diferentes estados
// (claro/escuro, desktop/mobile, aba Alugar) sem duplicar este script:
//   OUT=preview-dark.png DARK=1 VIEWPORT=390x844 TIPO=aluguel pnpm exec tsx scripts/generate-preview.ts
async function generatePreview() {
  const out = process.env.OUT || 'preview.png';
  const dark = process.env.DARK === '1';
  const [width, height] = (process.env.VIEWPORT || '1280x800').split('x').map(Number);
  const tipo = process.env.TIPO; // 'aluguel' clica na aba Alugar antes do screenshot

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width, height },
    colorScheme: dark ? 'dark' : 'light',
  });

  // Navigate to the preview server
  // Note: In CI this runs against the 'preview' build on port 4173
  try {
    console.log(`Navigating to http://localhost:4173... (out=${out}, dark=${dark}, viewport=${width}x${height}, tipo=${tipo || 'venda'})`);
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });

    // Wait for critical content
    await page.waitForSelector('main', { timeout: 10000 });

    if (tipo === 'aluguel') {
      await page.getByRole('tab', { name: /alugar/i }).click();
      await page.waitForTimeout(400);
    }

    // Take screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: out, fullPage: true });
    console.log(`Screenshot saved to ${out}`);
  } catch (error) {
    console.error('Error generating preview:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generatePreview();
