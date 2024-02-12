import { Browser } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin())

export async function puppetAdapter() {
  const browser = await puppeteer.launch();
  return browser;
}

export async function getNewPage(browser: Browser) {
  const page = await browser.newPage();

  page.setRequestInterception(true);

  page.on('request', interceptedRequest => {
    if (!interceptedRequest.method().includes('GET') ||
      interceptedRequest.url().endsWith('.png') ||
      interceptedRequest.url().endsWith('.js') ||
      interceptedRequest.url().endsWith('.css') ||
      interceptedRequest.url().endsWith('.gif') ||
      interceptedRequest.url().endsWith('.jpeg') ||
      interceptedRequest.url().endsWith('.jpg')) {
      interceptedRequest.abort();
    }
    else interceptedRequest.continue();
  });
  return page;
}
