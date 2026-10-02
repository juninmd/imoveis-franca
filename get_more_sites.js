const { chromium } = require('playwright');
async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://duckduckgo.com/html/?q=imobiliaria+franca+sp');
  const links = await page.$$eval('.result__url', els => els.map(e => e.textContent.trim()));
  console.log(links.filter(l => l.includes('.com.br')));
  await browser.close();
}
run();
