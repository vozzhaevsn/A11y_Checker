import '../src/scripts/background';

const STORAGE_DATA = {
  scanResults: [] as unknown[],
  settings: {
    wcagLevel: 'AA', locale: 'en',
    includeColorContrast: true, includeImages: true,
    includeKeyboard: true, includeSemantics: true,
    autoScanOnLoad: false, theme: 'light',
  },
  currentTabId: null,
};

// Capture listener before any clearAllMocks() can wipe it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let messageListener: ((...args: any[]) => any) | undefined;
beforeAll(() => {
  messageListener = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0]?.[0];
});

/** Wraps the raw message listener in a Promise for cleaner async tests */
function dispatch(action: string, payload?: unknown, tabId?: number): Promise<unknown> {
  return new Promise((resolve) => {
    messageListener!({ action, payload }, tabId !== undefined ? { tab: { id: tabId } } : {}, resolve);
  });
}

describe('BackgroundScript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({ a11yCheckerData: STORAGE_DATA });
    (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);
  });

  describe('badge after saveScanResult', () => {
    const makeResult = (critical: number, serious: number) => ({
      id: '1', url: 'https://example.com', timestamp: Date.now(), wcagLevel: 'AA' as const,
      summary: { total: critical + serious, critical, serious, moderate: 0, minor: 0 },
      issues: [],
    });

    it.each([
      ['critical > 0 → red', makeResult(2, 1), '2', '#d93025'],
      ['serious only → orange', makeResult(0, 2), '2', '#f29900'],
      ['neither → empty', makeResult(0, 0), '', '#65a30d'],
    ])('%s', async (_, result, text, color) => {
      if (!messageListener) return;
      const res = await dispatch('saveScanResult', result, 42);
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text, tabId: 42 });
      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color, tabId: 42 });
      expect(res).toEqual({ success: true });
    });
  });

  it('getAllScans returns stored results', async () => {
    if (!messageListener) return;
    const stored = [{ id: 'a', url: 'https://a.com', timestamp: 1, wcagLevel: 'AA' as const,
      summary: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 }, issues: [] }];
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      a11yCheckerData: { ...STORAGE_DATA, scanResults: stored },
    });
    const res = await dispatch('getAllScans') as { success: boolean; results: unknown[] };
    expect(res.success).toBe(true);
    expect(res.results).toEqual(stored);
  });
});
