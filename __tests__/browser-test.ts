import axios from 'axios';
import { Site } from '../src/types';
import BrowserSingleton from '../src/infra/browser';
import { retrieveContent } from '../src/imoveis';

jest.mock('axios');
jest.mock('../src/infra/browser');

describe('retrieveContent function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve content using Puppeteer', async () => {
    const url = 'https://www.agnelloimoveis.com.br/comprar/Franca/Casa/Bairro/Jardim-Elisa/7986';

    const site = {
      driver: 'puppet',
      waitFor: 'selector',
    };
    const expectedHtml = '<html><body>Mocked HTML content</body></html>';
    const mockedPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      waitForSelector: jest.fn().mockResolvedValue(undefined),
      content: jest.fn().mockResolvedValue(expectedHtml),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (BrowserSingleton.getNewPage as jest.Mock).mockResolvedValue(mockedPage);

    const result = await retrieveContent(url, site as Site);

    expect(BrowserSingleton.getNewPage).toHaveBeenCalledTimes(1);
    expect(mockedPage.goto).toHaveBeenCalledWith(url.trim(), { timeout: 30000, waitUntil: 'networkidle0' });
    expect(mockedPage.waitForSelector).toHaveBeenCalledWith(site.waitFor, { timeout: 10000 });
    expect(mockedPage.content).toHaveBeenCalledTimes(1);
    expect(mockedPage.close).toHaveBeenCalledTimes(1);
    expect(result).toBe(expectedHtml);
  });

  it('should retrieve content using Axios', async () => {
    const url = 'https://example.com';
    const site = {
      driver: 'axios',
      waitFor: 'selector',
    };
    const expectedHtml = '<html><body>Mocked HTML content <div id="selector"></div></body></html>';
    (axios.get as jest.Mock).mockResolvedValue({ data: expectedHtml });

    const result = await retrieveContent(url, site as any);

    expect(axios.get).toHaveBeenCalledWith(url, { responseEncoding: 'utf8', timeout: 30000 });
    expect(result).toBe(expectedHtml);
  });

  it('should retrieve content using Axios REST', async () => {
    const url = 'https://example.com';
    const site = {
      driver: 'axios_rest',
      method: 'POST',
      payload: { key: 'value' },
    };
    const expectedHtml = '<html><body>Mocked HTML content</body></html>';
    (axios.request as jest.Mock).mockResolvedValue({ data: expectedHtml });

    const result = await retrieveContent(url, site as any);

    expect(axios.request).toHaveBeenCalledWith({ url, method: 'POST', data: site.payload, params: undefined, timeout: 30000 });
    expect(result).toBe(expectedHtml);
  });

  it('should throw an error when driver is unknown', async () => {
    const url = 'https://example.com';
    const site = {
      driver: 'unknown',
    };

    await expect(retrieveContent(url, site as any)).rejects.toThrowError('Html content not found');
  });
});
