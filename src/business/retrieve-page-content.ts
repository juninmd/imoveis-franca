import axios from 'axios';
import browser from '../infra/browser';
import { Site } from '../types';

export async function retrieveContent(url: string, site: Site, params = undefined) {
  if (site.driver === 'puppet') {
    const page = await browser.getNewPage();

    await page.goto(url.trim(), { timeout: 20000, waitUntil: 'networkidle0' });

    if (site.waitFor) {
      await page.waitForSelector(site.waitFor);
    }

    const html = await page.content();
    await page.close();
    return html;
  } else if (site.driver === 'axios') {
    const { data: html } = await axios.get(url, { responseType: 'text' });
    if (site.waitFor == undefined || (html as string).indexOf(site.waitFor) >= 0) {
      return html;
    }
  } else if (site.driver === 'axios_rest') {
    const { data: html } = await axios.request({ url, method: site.method, data: site.payload, params });
    return html;
  }

  throw new Error(`Html content not found`);
}