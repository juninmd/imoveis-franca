import { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteerExtra.use(StealthPlugin());

class BrowserSingleton {
  private static instance: BrowserSingleton;
  private browser: Browser | null = null;

  private constructor() { }

  public static getInstance(): BrowserSingleton {
    if (!BrowserSingleton.instance) {
      BrowserSingleton.instance = new BrowserSingleton();
    }
    return BrowserSingleton.instance;
  }

  public async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteerExtra.launch();
    }
    return this.browser;
  }

  public async getNewPage(): Promise<Page> {
    const browser = await this.getBrowser();
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
      } else {
        interceptedRequest.continue();
      }
    });
    return page;
  }
}

export default BrowserSingleton.getInstance();
