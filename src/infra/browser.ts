import { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

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

  // Chromium compartilhado degrada depois de centenas de paginas (respostas vazias, 'Session with
  // given id not found'). O proximo getNewPage abre um browser novo; o antigo fecha depois de um
  // prazo para as paginas que ainda estao em voo (outros sites rodam em paralelo) terminarem.
  public recycle(graceMs = 90000): void {
    const old = this.browser;
    if (!old) return;
    this.browser = null;
    setTimeout(() => { old.close().catch(() => undefined); }, graceMs).unref();
  }

  // Sem isto, um SIGTERM (deploy, `docker compose down`, reciclagem do pod) deixava o
  // processo do Chromium órfão segurando memória.
  public async close(): Promise<void> {
    if (this.browser) {
      const browser = this.browser;
      this.browser = null;
      await browser.close();
    }
  }
}

export default BrowserSingleton.getInstance();
