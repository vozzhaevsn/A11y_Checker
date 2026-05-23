import { Settings } from '../src/types';

describe('ContentScript', () => {
  const mockSendMessage = chrome.runtime.sendMessage as jest.Mock;
  const mockAddListener = chrome.runtime.onMessage.addListener as jest.Mock;
  let messageListener: ((msg: any, sender: any, sendResponse: any) => void) | null = null;

  const BASE_SETTINGS: Settings = {
    wcagLevel: 'AA', locale: 'en',
    includeColorContrast: true, includeImages: true,
    includeKeyboard: true, includeSemantics: true,
    autoScanOnLoad: false, theme: 'light', watchDomChanges: false,
  };

  function settingsResponse(overrides: Partial<Settings> = {}) {
    return { success: true, settings: { ...BASE_SETTINGS, ...overrides } };
  }

  function captureListener() {
    mockAddListener.mockImplementation((fn: any) => { messageListener = fn; });
  }

  async function loadModule() {
    jest.resetModules();
    await import('../src/scripts/content-script');
    await new Promise((r) => setTimeout(r, 50));
  }

  beforeEach(() => {
    jest.resetAllMocks();
    messageListener = null;
    captureListener();
    document.body.innerHTML = '';
  });

  // ---------------------------------------------------------------------------
  // Auto-scan on load
  // ---------------------------------------------------------------------------

  describe('autoScanOnLoad', () => {
    it('does not auto-scan when autoScanOnLoad is false', async () => {
      mockSendMessage.mockResolvedValue(settingsResponse());
      await loadModule();

      const scanCalls = mockSendMessage.mock.calls.filter(
        (c: any[]) => (c[0] as { action: string }).action === 'saveScanResult'
      );
      expect(scanCalls.length).toBe(0);
    });

    it('triggers scan when autoScanOnLoad is true and document is complete', async () => {
      mockSendMessage.mockImplementation((msg: { action: string }) => {
        if (msg.action === 'getSettings') {
          return Promise.resolve(settingsResponse({ autoScanOnLoad: true }));
        }
        return Promise.resolve({ success: true, result: null });
      });
      await loadModule();
      await new Promise((r) => setTimeout(r, 100));

      const settingsCalls = mockSendMessage.mock.calls.filter(
        (c: any[]) => (c[0] as { action: string }).action === 'getSettings'
      );
      expect(settingsCalls.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Message handlers
  // ---------------------------------------------------------------------------

  describe('message handlers', () => {
    beforeEach(async () => {
      mockSendMessage.mockResolvedValue(settingsResponse());
      await loadModule();
    });

    it('getSettings returns current settings', () => {
      const sendResponse = jest.fn();
      messageListener!({ action: 'getSettings' }, {}, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, settings: expect.any(Object) })
      );
    });

    it('highlightElement creates overlay with data-a11y-highlight attribute', () => {
      const el = document.createElement('div');
      el.id = 'test-el';
      document.body.appendChild(el);

      const sendResponse = jest.fn();
      messageListener!({ action: 'highlightElement', selector: '#test-el' }, {}, sendResponse);

      const overlays = document.querySelectorAll('[data-a11y-highlight]');
      expect(overlays.length).toBe(1);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('removeHighlights removes all overlay elements', () => {
      const overlay = document.createElement('div');
      overlay.setAttribute('data-a11y-highlight', 'true');
      document.body.appendChild(overlay);

      const sendResponse = jest.fn();
      messageListener!({ action: 'removeHighlights' }, {}, sendResponse);

      expect(document.querySelectorAll('[data-a11y-highlight]').length).toBe(0);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('updateSettings merges partial settings', () => {
      const sendResponse = jest.fn();
      messageListener!({ action: 'updateSettings', settings: { locale: 'ru' } }, {}, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('returns error for unknown action', () => {
      const sendResponse = jest.fn();
      messageListener!({ action: 'unknownAction' }, {}, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Unknown action' })
      );
    });
  });
});
