import { ScanResult } from '../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PANEL_HTML = `
  <div class="container">
    <div class="controls">
      <button id="scan-btn">Run Accessibility Scan</button>
      <button id="export-btn">Export JSON</button>
      <button id="clear-btn">Clear</button>
    </div>
    <div class="results-container" id="results-container">
      <p>No scan results yet.</p>
    </div>
    <div class="status-bar" id="status-bar">Ready</div>
  </div>
`;

/** Base settings shared across all tests — override locale as needed */
const BASE_SETTINGS = {
  wcagLevel: 'AA' as const,
  includeColorContrast: true,
  includeImages: true,
  includeKeyboard: true,
  includeSemantics: true,
  autoScanOnLoad: false,
  theme: 'light' as const,
};

const settingsMock = (locale: 'en' | 'ru' = 'en') => ({
  success: true,
  settings: { ...BASE_SETTINGS, locale },
});

function buildScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    id: 'r1',
    url: 'https://example.com',
    timestamp: new Date('2024-01-15').getTime(),
    wcagLevel: 'AA',
    summary: { total: 2, critical: 1, serious: 1, moderate: 0, minor: 0 },
    issues: [],
    ...overrides,
  };
}

function buildIssue(overrides = {}) {
  return {
    id: 'i1',
    element: { tagName: 'img', id: 'logo', className: '', attributes: {}, textContent: '', position: { top: 0, right: 0, bottom: 0, left: 0 } },
    description: 'Image missing alt text',
    help: 'Provide alt text',
    helpUrl: 'https://deque.com',
    impact: 'critical' as const,
    tags: [],
    wcagLevels: ['A' as const],
    wcagCriteria: ['1.1.1'],
    fixSuggestions: [],
    ...overrides,
  };
}

async function loadPanel(): Promise<void> {
  jest.resetModules();
  await import('../src/ui/devtools-panel');
  await new Promise((r) => setTimeout(r, 50));
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('DevToolsPanelUI', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    document.body.innerHTML = PANEL_HTML;
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  describe('bootstrap / initialization', () => {
    it('applies EN locale: buttons, status bar, document.lang', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(settingsMock('en'));
      await loadPanel();
      expect(document.getElementById('scan-btn')!.textContent).toBe('Run Accessibility Scan');
      expect(document.getElementById('export-btn')!.textContent).toBe('Export JSON');
      expect(document.getElementById('clear-btn')!.textContent).toBe('Clear');
      expect(document.getElementById('status-bar')!.textContent).toBe('Ready to scan');
      expect(document.documentElement.lang).toBe('en');
    });

    it('applies RU locale: buttons and document.lang', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(settingsMock('ru'));
      await loadPanel();
      expect(document.getElementById('scan-btn')!.textContent).toBe('Запустить проверку доступности');
      expect(document.getElementById('export-btn')!.textContent).toBe('Экспорт JSON');
      expect(document.getElementById('clear-btn')!.textContent).toBe('Очистить');
      expect(document.documentElement.lang).toBe('ru');
    });

    it.each([
      ['failure response', { success: false }],
      ['unrecognised locale', { success: true, settings: { ...BASE_SETTINGS, locale: 'de' } }],
    ])('falls back to English on %s', async (_, mockValue) => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(mockValue);
      await loadPanel();
      expect(document.getElementById('scan-btn')!.textContent).toBe('Run Accessibility Scan');
      expect(document.getElementById('status-bar')!.textContent).toBe('Ready to scan');
    });

    it('falls back to English when sendMessage rejects', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue(new Error('extension not connected'));
      await loadPanel();
      expect(document.getElementById('scan-btn')!.textContent).toBe('Run Accessibility Scan');
    });
  });

  // -------------------------------------------------------------------------
  // Scan button
  // -------------------------------------------------------------------------

  describe('scan button', () => {
    it('sends devtoolsScan message with inspectedWindow.tabId on click', async () => {
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce(settingsMock())
        .mockResolvedValueOnce({ success: true, result: buildScanResult() });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      const scanCall = (chrome.runtime.sendMessage as jest.Mock).mock.calls
        .find((c) => c[0]?.action === 'devtoolsScan');
      expect(scanCall).toBeDefined();
      expect(scanCall![0].tabId).toBe(1);
    });

    it('shows "Running scan…" in status bar immediately on click', async () => {
      let resolveDevtoolsScan!: (v: unknown) => void;
      const pendingScan = new Promise((res) => { resolveDevtoolsScan = res; });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce(settingsMock())
        .mockReturnValueOnce(pendingScan);

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 0));
      expect(document.getElementById('status-bar')!.textContent).toBe('Running scan...');

      resolveDevtoolsScan({ success: true, result: buildScanResult() });
      await new Promise((r) => setTimeout(r, 50));
    });

    it('shows summary in status bar after successful scan', async () => {
      const result = buildScanResult({ summary: { total: 5, critical: 2, serious: 3, moderate: 0, minor: 0 } });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce(settingsMock())
        .mockResolvedValueOnce({ success: true, result });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.getElementById('status-bar')!.textContent).toBe('Found 5 issues (2 critical)');
    });

    it.each([
      ['failure response', { success: false, error: 'tab not found' }, 'tab not found'],
    ])('shows "Scan failed:" on %s', async (_, mockValue, errorText) => {
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce(settingsMock())
        .mockResolvedValueOnce(mockValue);

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      const statusBar = document.getElementById('status-bar')!.textContent!;
      expect(statusBar).toContain('Scan failed:');
      expect(statusBar).toContain(errorText);
    });

    it('shows "Scan failed:" when scan throws', async () => {
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce(settingsMock())
        .mockRejectedValueOnce(new Error('network error'));

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      const statusBar = document.getElementById('status-bar')!.textContent!;
      expect(statusBar).toContain('Scan failed:');
      expect(statusBar).toContain('network error');
    });

    it('shows "unknown error" when scan returns failure with no error field', async () => {
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce(settingsMock())
        .mockResolvedValueOnce({ success: false });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.getElementById('status-bar')!.textContent).toContain('unknown error');
    });
  });

  // -------------------------------------------------------------------------
  // Render results
  // -------------------------------------------------------------------------

  describe('renderResults', () => {
    async function scan(result: ScanResult, locale: 'en' | 'ru' = 'en') {
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce(settingsMock(locale))
        .mockResolvedValueOnce({ success: true, result });
      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));
    }

    it('shows "No issues found" when issues array is empty', async () => {
      await scan(buildScanResult({ issues: [] }));
      expect(document.getElementById('results-container')!.innerHTML).toContain('No issues found.');
    });

    it('renders one result-item per issue', async () => {
      await scan(buildScanResult({
        summary: { total: 2, critical: 1, serious: 1, moderate: 0, minor: 0 },
        issues: [
          buildIssue({ id: 'i1', impact: 'critical', wcagCriteria: ['1.1.1'] }),
          buildIssue({ id: 'i2', impact: 'serious', wcagCriteria: ['1.4.3'],
            element: { tagName: 'p', id: '', className: '', attributes: {}, textContent: '', position: { top: 0, right: 0, bottom: 0, left: 0 } } }),
        ],
      }));
      expect(document.querySelectorAll('.result-item')).toHaveLength(2);
    });

    it.each([
      ['with id', { tagName: 'img', id: 'logo' }, 'img#logo'],
      ['without id', { tagName: 'div', id: '' }, 'div'],
    ])('renders element tag %s in element-tag span', async (_, elementOverrides, expected) => {
      await scan(buildScanResult({
        summary: { total: 1, critical: 1, serious: 0, moderate: 0, minor: 0 },
        issues: [buildIssue({ element: { className: '', attributes: {}, textContent: '', position: { top: 0, right: 0, bottom: 0, left: 0 }, ...elementOverrides } })],
      }));
      expect(document.querySelector('.element-tag')!.textContent).toBe(expected);
    });

    it('renders RU impact label', async () => {
      await scan(buildScanResult({
        summary: { total: 1, critical: 1, serious: 0, moderate: 0, minor: 0 },
        issues: [buildIssue({ impact: 'critical' })],
      }), 'ru');
      expect(document.querySelector('.critical')!.textContent).toBe('Критический');
    });

    it('escapes HTML in description text', async () => {
      await scan(buildScanResult({
        summary: { total: 1, critical: 1, serious: 0, moderate: 0, minor: 0 },
        issues: [buildIssue({ description: '<script>alert("xss")</script>' })],
      }));
      const container = document.getElementById('results-container')!;
      expect(container.querySelector('script')).toBeNull();
      expect(container.innerHTML).toContain('&lt;script&gt;');
    });

    it('renders WCAG criteria', async () => {
      await scan(buildScanResult({
        summary: { total: 1, critical: 1, serious: 0, moderate: 0, minor: 0 },
        issues: [buildIssue({ wcagCriteria: ['1.1.1', '1.4.3'] })],
      }));
      const wcagDiv = document.querySelector('.wcag')!;
      expect(wcagDiv.textContent).toContain('1.1.1');
      expect(wcagDiv.textContent).toContain('1.4.3');
    });
  });

  // -------------------------------------------------------------------------
  // Clear button
  // -------------------------------------------------------------------------

  describe('clear button', () => {
    it('resets container and status bar (EN)', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(settingsMock('en'));
      await loadPanel();
      document.getElementById('clear-btn')!.click();
      await new Promise((r) => setTimeout(r, 10));

      const html = document.getElementById('results-container')!.innerHTML;
      expect(html).toContain('No scan results yet. Click');
      expect(document.getElementById('status-bar')!.textContent).toBe('Results cleared');
    });

    it('uses RU strings in status bar', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(settingsMock('ru'));
      await loadPanel();
      document.getElementById('clear-btn')!.click();
      expect(document.getElementById('status-bar')!.textContent).toBe('Результаты очищены');
    });
  });

  // -------------------------------------------------------------------------
  // Export button
  // -------------------------------------------------------------------------

  describe('export button', () => {
    it.each([
      ['EN', 'en', 'Run a scan first.'],
      ['RU', 'ru', 'Сначала выполните сканирование.'],
    ])('shows "run a scan first" in %s when no scan performed', async (_, locale, expected) => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(settingsMock(locale as 'en' | 'ru'));
      await loadPanel();
      document.getElementById('export-btn')!.click();
      expect(document.getElementById('status-bar')!.textContent).toBe(expected);
    });

    it('exports JSON and shows "Exported as JSON" after a successful scan', async () => {
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = jest.fn().mockReturnValue('blob:mock');
      URL.revokeObjectURL = jest.fn();

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce(settingsMock())
        .mockResolvedValueOnce({ success: true, result: buildScanResult({ issues: [] }) });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));
      document.getElementById('export-btn')!.click();

      expect(document.getElementById('status-bar')!.textContent).toBe('Exported as JSON');
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);

      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });
  });
});
