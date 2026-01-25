jest.mock('puppeteer-extra', () => {
  return {
    __esModule: true,
    default: {
      use: jest.fn(),
      launch: jest.fn(),
    }
  };
});

jest.mock('puppeteer-extra-plugin-stealth', () => () => 'stealth-plugin');

describe('BrowserSingleton', () => {
  let mockBrowser: any;
  let mockPage: any;
  let mockRequest: any;
  let BrowserSingleton: any;
  let puppeteerExtra: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Re-import mocks and module under test to ensure fresh state
    puppeteerExtra = require('puppeteer-extra').default;
    BrowserSingleton = require('../src/infra/browser').default;

    mockRequest = {
      method: jest.fn(),
      url: jest.fn(),
      abort: jest.fn(),
      continue: jest.fn(),
    };

    mockPage = {
      setRequestInterception: jest.fn(),
      on: jest.fn(),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
    };

    // Configure the specific mock instance used in this run
    (puppeteerExtra.launch as jest.Mock).mockResolvedValue(mockBrowser);
  });

  it('should be a singleton instance (module caching)', () => {
    // In Node, singleton via module export relies on require cache.
    // Since we are inside one test, subsequent requires (without reset) should match.
    const instance2 = require('../src/infra/browser').default;
    expect(BrowserSingleton).toBe(instance2);
  });

  it('should launch browser if not initialized', async () => {
    await BrowserSingleton.getBrowser();
    expect(puppeteerExtra.launch).toHaveBeenCalledTimes(1);

    // Call again, should not launch again (because instance persists state)
    await BrowserSingleton.getBrowser();
    expect(puppeteerExtra.launch).toHaveBeenCalledTimes(1);
  });

  it('should create a new page with request interception', async () => {
    const page = await BrowserSingleton.getNewPage();
    expect(mockBrowser.newPage).toHaveBeenCalled();
    expect(page.setRequestInterception).toHaveBeenCalledWith(true);
    expect(page.on).toHaveBeenCalledWith('request', expect.any(Function));
  });

  it('should intercept requests correctly', async () => {
    // Capture the request handler
    let requestHandler: ((req: any) => void) | undefined;
    mockPage.on.mockImplementation((event: any, handler: any) => {
      if (event === 'request') requestHandler = handler;
    });

    await BrowserSingleton.getNewPage();
    expect(requestHandler).toBeDefined();

    // Test case 1: Non-GET request -> Abort
    mockRequest.method.mockReturnValue('POST');
    requestHandler!(mockRequest);
    expect(mockRequest.abort).toHaveBeenCalled();

    // Test case 2: Image/Asset request -> Abort
    mockRequest.method.mockReturnValue('GET');
    mockRequest.url.mockReturnValue('http://example.com/image.png');
    requestHandler!(mockRequest);
    expect(mockRequest.abort).toHaveBeenCalledTimes(2);

    // Test case 3: Valid GET request -> Continue
    mockRequest.method.mockReturnValue('GET');
    mockRequest.url.mockReturnValue('http://example.com/page');
    requestHandler!(mockRequest);
    expect(mockRequest.continue).toHaveBeenCalled();
  });
});
