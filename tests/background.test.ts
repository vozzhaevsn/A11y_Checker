// Import background to trigger BackgroundScript instantiation and listener registration
import '../src/scripts/background';

// Capture the listener once before any clearAllMocks() can wipe it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let messageListener: ((...args: any[]) => any) | undefined;
beforeAll(() => {
  messageListener = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0]?.[0];
});

describe('BackgroundScript badge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      a11yCheckerData: {
        scanResults: [],
        settings: {
          wcagLevel: 'AA', locale: 'en',
          includeColorContrast: true, includeImages: true,
          includeKeyboard: true, includeSemantics: true,
          autoScanOnLoad: false, theme: 'light',
        },
        currentTabId: null,
      },
    });
    (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);
  });

  it('sets red badge when critical issues exist', (done) => {
    if (!messageListener) { done(); return; }
    const result = {
      id: '1', url: 'https://example.com', timestamp: Date.now(),
      wcagLevel: 'AA' as const,
      summary: { total: 3, critical: 2, serious: 1, moderate: 0, minor: 0 },
      issues: [],
    };
    messageListener(
      { action: 'saveScanResult', payload: result },
      { tab: { id: 42 } },
      (res: unknown) => {
        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '2', tabId: 42 });
        expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#d93025', tabId: 42 });
        expect(res).toEqual({ success: true });
        done();
      },
    );
  });

  it('sets orange badge when serious but no critical issues', (done) => {
    if (!messageListener) { done(); return; }
    const result = {
      id: '2', url: 'https://example.com', timestamp: Date.now(),
      wcagLevel: 'AA' as const,
      summary: { total: 2, critical: 0, serious: 2, moderate: 0, minor: 0 },
      issues: [],
    };
    messageListener(
      { action: 'saveScanResult', payload: result },
      { tab: { id: 5 } },
      () => {
        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '2', tabId: 5 });
        expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#f29900', tabId: 5 });
        done();
      },
    );
  });

  it('clears badge when no critical or serious issues', (done) => {
    if (!messageListener) { done(); return; }
    const result = {
      id: '3', url: 'https://example.com', timestamp: Date.now(),
      wcagLevel: 'AA' as const,
      summary: { total: 1, critical: 0, serious: 0, moderate: 1, minor: 0 },
      issues: [],
    };
    messageListener(
      { action: 'saveScanResult', payload: result },
      { tab: { id: 1 } },
      () => {
        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '', tabId: 1 });
        done();
      },
    );
  });
});

describe('BackgroundScript getAllScans', () => {
  it('returns all stored scan results', (done) => {
    if (!messageListener) { done(); return; }
    const storedResults = [
      { id: 'a', url: 'https://a.com', timestamp: 1, wcagLevel: 'AA' as const, summary: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 }, issues: [] },
    ];
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      a11yCheckerData: {
        scanResults: storedResults,
        settings: { wcagLevel: 'AA', locale: 'en', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
        currentTabId: null,
      },
    });

    messageListener(
      { action: 'getAllScans' },
      {},
      (res: unknown) => {
        expect((res as { success: boolean; results: unknown[] }).success).toBe(true);
        expect((res as { success: boolean; results: unknown[] }).results).toEqual(storedResults);
        done();
      },
    );
  });
});
