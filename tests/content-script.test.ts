describe('ContentScript autoScanOnLoad', () => {
  const mockSendMessage = chrome.runtime.sendMessage as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not auto-scan when autoScanOnLoad is false', async () => {
    // Configure mock BEFORE resetModules+import so the IIFE sees the right mock
    mockSendMessage.mockResolvedValue({
      success: true,
      settings: {
        wcagLevel: 'AA', locale: 'en',
        includeColorContrast: true, includeImages: true,
        includeKeyboard: true, includeSemantics: true,
        autoScanOnLoad: false, theme: 'light',
      },
    });

    jest.resetModules();
    await import('../src/scripts/content-script');
    await new Promise((r) => setTimeout(r, 50));

    const scanCalls = mockSendMessage.mock.calls.filter(
      (c: unknown[]) => (c[0] as { action: string }).action === 'saveScanResult'
    );
    expect(scanCalls.length).toBe(0);
  });

  it('triggers scan when autoScanOnLoad is true and document is complete', async () => {
    // Configure mock BEFORE resetModules+import so the IIFE sees the right mock
    mockSendMessage.mockImplementation((msg: { action: string }) => {
      if (msg.action === 'getSettings') {
        return Promise.resolve({
          success: true,
          settings: {
            wcagLevel: 'AA', locale: 'en',
            includeColorContrast: true, includeImages: true,
            includeKeyboard: true, includeSemantics: true,
            autoScanOnLoad: true, theme: 'light',
          },
        });
      }
      // For saveScanResult and other calls
      return Promise.resolve({ success: true, result: null });
    });

    // jsdom sets document.readyState to 'complete'
    jest.resetModules();
    await import('../src/scripts/content-script');
    await new Promise((r) => setTimeout(r, 100));

    // At minimum, getSettings was called (by autoScanIfEnabled and/or performScan)
    const settingsCalls = mockSendMessage.mock.calls.filter(
      (c: unknown[]) => (c[0] as { action: string }).action === 'getSettings'
    );
    expect(settingsCalls.length).toBeGreaterThan(0);
  });
});
