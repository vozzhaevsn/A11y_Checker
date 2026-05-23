import '../src/scripts/background';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let messageListener: ((...args: any[]) => any) | undefined;
beforeAll(() => {
  messageListener = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0]?.[0];
});

function dispatch(action: string, payload?: unknown, tabId?: number): Promise<unknown> {
  return new Promise((resolve) => {
    messageListener!({ action, payload }, tabId !== undefined ? { tab: { id: tabId } } : {}, resolve);
  });
}

function storageData() {
  return {
    scanResults: [] as unknown[],
    settings: {
      wcagLevel: 'AA', locale: 'en',
      includeColorContrast: true, includeImages: true,
      includeKeyboard: true, includeSemantics: true,
      autoScanOnLoad: false, theme: 'light', watchDomChanges: false,
    },
    currentTabId: null,
  };
}

function makeResult(critical: number, serious: number, overrides = {}) {
  return {
    id: '1', url: 'https://example.com', timestamp: Date.now(), wcagLevel: 'AA' as const,
    summary: { total: critical + serious, critical, serious, moderate: 0, minor: 0 },
    issues: [],
    ...overrides,
  };
}

describe('BackgroundScript', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({ a11yCheckerData: storageData() });
    (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);
  });

  // ---------------------------------------------------------------------------
  // saveScanResult → badge
  // ---------------------------------------------------------------------------

  describe('badge after saveScanResult', () => {
    it.each([
      ['critical > 0 → red', makeResult(2, 1), '2', '#d93025'],
      ['serious only → orange', makeResult(0, 2), '2', '#f29900'],
      ['neither → empty', makeResult(0, 0), '', '#65a30d'],
    ])('%s', async (_, result, text, color) => {
      const res = await dispatch('saveScanResult', result, 42);
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text, tabId: 42 });
      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color, tabId: 42 });
      expect(res).toEqual({ success: true });
    });
  });

  // ---------------------------------------------------------------------------
  // Query handlers
  // ---------------------------------------------------------------------------

  it('getLastScan returns the most recent result', async () => {
    const stored = [makeResult(3, 0, { id: 'latest' }), makeResult(1, 0, { id: 'older' })];
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      a11yCheckerData: { ...storageData(), scanResults: stored },
    });
    const res = await dispatch('getLastScan') as { success: boolean; result: { id: string } };
    expect(res.success).toBe(true);
    expect(res.result.id).toBe('latest');
  });

  it('getLastScan returns null when no results', async () => {
    const res = await dispatch('getLastScan') as { success: boolean; result: unknown };
    expect(res.success).toBe(true);
    expect(res.result).toBeNull();
  });

  it('getSettings returns stored settings', async () => {
    const res = await dispatch('getSettings') as { success: boolean; settings: unknown };
    expect(res.success).toBe(true);
    expect(res.settings).toEqual(storageData().settings);
  });

  it('updateSettings merges and persists', async () => {
    const res = await dispatch('updateSettings', { locale: 'ru' });
    expect(res).toEqual({ success: true });
    expect(chrome.storage.local.set).toHaveBeenCalled();
    const setArg = (chrome.storage.local.set as jest.Mock).mock.calls[0]?.[0];
    expect(setArg?.a11yCheckerData?.settings?.locale).toBe('ru');
  });

  it('clearResults removes all scan results', async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      a11yCheckerData: { ...storageData(), scanResults: [makeResult(1, 0)] },
    });
    const res = await dispatch('clearResults');
    expect(res).toEqual({ success: true });
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        a11yCheckerData: expect.objectContaining({ scanResults: [] }),
      })
    );
  });

  it('getAllScans returns stored results', async () => {
    const stored = [makeResult(1, 0, { id: 'a', url: 'https://a.com' })];
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      a11yCheckerData: { ...storageData(), scanResults: stored },
    });
    const res = await dispatch('getAllScans') as { success: boolean; results: unknown[] };
    expect(res.success).toBe(true);
    expect(res.results).toEqual(stored);
  });

  it('returns error for unknown action', async () => {
    const res = await dispatch('unknownAction');
    expect(res).toEqual({ success: false, error: 'Unknown action' });
  });
});
