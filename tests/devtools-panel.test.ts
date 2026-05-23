/**
 * Tests for src/ui/devtools-panel.ts
 *
 * The module runs `new DevToolsPanelUI()` as an IIFE on import, so we use
 * jest.resetModules() + dynamic import() for each test scenario.
 */

import { ScanResult } from '../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal HTML that matches the IDs devtools-panel.ts looks up */
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

/** Import the panel module after resetting modules */
async function loadPanel(): Promise<void> {
  jest.resetModules();
  await import('../src/ui/devtools-panel');
  // Let the async bootstrap (loadLocale + applyUiStrings) finish
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
    it('sets status bar to "Ready to scan" (EN) after init', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: {
          locale: 'en', wcagLevel: 'AA',
          includeColorContrast: true, includeImages: true,
          includeKeyboard: true, includeSemantics: true,
          autoScanOnLoad: false, theme: 'light',
        },
      });

      await loadPanel();

      expect(document.getElementById('status-bar')!.textContent).toBe('Ready to scan');
    });

    it('applies EN button labels when locale is "en"', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
      });

      await loadPanel();

      expect(document.getElementById('scan-btn')!.textContent).toBe('Run Accessibility Scan');
      expect(document.getElementById('export-btn')!.textContent).toBe('Export JSON');
      expect(document.getElementById('clear-btn')!.textContent).toBe('Clear');
    });

    it('applies RU button labels when locale is "ru"', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: { locale: 'ru', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
      });

      await loadPanel();

      expect(document.getElementById('scan-btn')!.textContent).toBe('Запустить проверку доступности');
      expect(document.getElementById('export-btn')!.textContent).toBe('Экспорт JSON');
      expect(document.getElementById('clear-btn')!.textContent).toBe('Очистить');
    });

    it('sets document.documentElement.lang to "ru" when locale is "ru"', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: { locale: 'ru', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
      });

      await loadPanel();

      expect(document.documentElement.lang).toBe('ru');
    });

    it('sets document.documentElement.lang to "en" when locale is "en"', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
      });

      await loadPanel();

      expect(document.documentElement.lang).toBe('en');
    });

    it('falls back to English when getSettings returns failure', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({ success: false });

      await loadPanel();

      expect(document.getElementById('scan-btn')!.textContent).toBe('Run Accessibility Scan');
      expect(document.getElementById('status-bar')!.textContent).toBe('Ready to scan');
    });

    it('falls back to English when sendMessage throws', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue(new Error('extension not connected'));

      await loadPanel();

      expect(document.getElementById('scan-btn')!.textContent).toBe('Run Accessibility Scan');
    });

    it('falls back to English for an unrecognised locale string', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: { locale: 'de', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
      });

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
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })  // getSettings
        .mockResolvedValueOnce({ success: true, result: buildScanResult() }); // devtoolsScan

      await loadPanel();

      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      const calls = (chrome.runtime.sendMessage as jest.Mock).mock.calls;
      const scanCall = calls.find((c) => c[0]?.action === 'devtoolsScan');
      expect(scanCall).toBeDefined();
      expect(scanCall![0].tabId).toBe(1); // inspectedWindow.tabId is 1 in setup.ts
    });

    it('shows "Running scan…" in status bar immediately on click', async () => {
      let resolveDevtoolsScan!: (v: unknown) => void;
      const pendingScan = new Promise((res) => { resolveDevtoolsScan = res; });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockReturnValueOnce(pendingScan);

      await loadPanel();

      document.getElementById('scan-btn')!.click();
      // Status bar is updated synchronously before the await inside runScan
      await new Promise((r) => setTimeout(r, 0));
      expect(document.getElementById('status-bar')!.textContent).toBe('Running scan...');

      resolveDevtoolsScan({ success: true, result: buildScanResult() });
      await new Promise((r) => setTimeout(r, 50));
    });

    it('shows summary in status bar after successful scan with issues', async () => {
      const result = buildScanResult({
        summary: { total: 5, critical: 2, serious: 3, moderate: 0, minor: 0 },
        issues: [],
      });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: true, result });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.getElementById('status-bar')!.textContent).toBe('Found 5 issues (2 critical)');
    });

    it('shows error in status bar when scan returns failure', async () => {
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: false, error: 'tab not found' });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.getElementById('status-bar')!.textContent).toContain('Scan failed:');
      expect(document.getElementById('status-bar')!.textContent).toContain('tab not found');
    });

    it('shows error in status bar when scan returns failure with no error message', async () => {
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: false });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.getElementById('status-bar')!.textContent).toContain('unknown error');
    });

    it('shows error in status bar when scan throws', async () => {
      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockRejectedValueOnce(new Error('network error'));

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.getElementById('status-bar')!.textContent).toContain('Scan failed:');
      expect(document.getElementById('status-bar')!.textContent).toContain('network error');
    });
  });

  // -------------------------------------------------------------------------
  // Render results
  // -------------------------------------------------------------------------

  describe('renderResults', () => {
    it('shows "No issues found" paragraph when issues array is empty', async () => {
      const result = buildScanResult({ issues: [] });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: true, result });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.getElementById('results-container')!.innerHTML).toContain('No issues found.');
    });

    it('renders one result-item per issue', async () => {
      const result = buildScanResult({
        summary: { total: 2, critical: 1, serious: 1, moderate: 0, minor: 0 },
        issues: [
          buildIssue({ id: 'i1', impact: 'critical', description: 'Missing alt', wcagCriteria: ['1.1.1'] }),
          buildIssue({ id: 'i2', impact: 'serious', description: 'Low contrast', wcagCriteria: ['1.4.3'],
            element: { tagName: 'p', id: '', className: '', attributes: {}, textContent: '', position: { top: 0, right: 0, bottom: 0, left: 0 } } }),
        ],
      });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: true, result });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      const items = document.querySelectorAll('.result-item');
      expect(items).toHaveLength(2);
    });

    it('renders element tag with id in element-tag span', async () => {
      const result = buildScanResult({
        summary: { total: 1, critical: 1, serious: 0, moderate: 0, minor: 0 },
        issues: [buildIssue({ element: { tagName: 'img', id: 'logo', className: '', attributes: {}, textContent: '', position: { top: 0, right: 0, bottom: 0, left: 0 } } })],
      });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: true, result });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.querySelector('.element-tag')!.textContent).toBe('img#logo');
    });

    it('renders element tag without id when id is empty', async () => {
      const result = buildScanResult({
        summary: { total: 1, critical: 0, serious: 1, moderate: 0, minor: 0 },
        issues: [buildIssue({ element: { tagName: 'div', id: '', className: '', attributes: {}, textContent: '', position: { top: 0, right: 0, bottom: 0, left: 0 } } })],
      });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: true, result });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.querySelector('.element-tag')!.textContent).toBe('div');
    });

    it('renders impact label in RU locale', async () => {
      const result = buildScanResult({
        summary: { total: 1, critical: 1, serious: 0, moderate: 0, minor: 0 },
        issues: [buildIssue({ impact: 'critical' })],
      });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'ru', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: true, result });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.querySelector('.critical')!.textContent).toBe('Критический');
    });

    it('escapes HTML in description text', async () => {
      const result = buildScanResult({
        summary: { total: 1, critical: 1, serious: 0, moderate: 0, minor: 0 },
        issues: [buildIssue({ description: '<script>alert("xss")</script>' })],
      });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: true, result });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      const container = document.getElementById('results-container')!;
      // Raw <script> tag must not exist in the DOM as an element
      expect(container.querySelector('script')).toBeNull();
      // The escaped text should appear literally
      expect(container.innerHTML).toContain('&lt;script&gt;');
    });

    it('renders WCAG criteria in the result item', async () => {
      const result = buildScanResult({
        summary: { total: 1, critical: 1, serious: 0, moderate: 0, minor: 0 },
        issues: [buildIssue({ wcagCriteria: ['1.1.1', '1.4.3'] })],
      });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: true, result });

      await loadPanel();
      document.getElementById('scan-btn')!.click();
      await new Promise((r) => setTimeout(r, 50));

      const wcagDiv = document.querySelector('.wcag')!;
      expect(wcagDiv.textContent).toContain('1.1.1');
      expect(wcagDiv.textContent).toContain('1.4.3');
    });
  });

  // -------------------------------------------------------------------------
  // Clear button
  // -------------------------------------------------------------------------

  describe('clear button', () => {
    it('resets results-container to "No scan results yet" message', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
      });

      await loadPanel();

      document.getElementById('clear-btn')!.click();
      await new Promise((r) => setTimeout(r, 10));

      // jsdom renders innerHTML with the literal quote characters, not &quot;
      const html = document.getElementById('results-container')!.innerHTML;
      expect(html).toContain('No scan results yet. Click');
      expect(html).toContain('Run Accessibility Scan');
    });

    it('updates status bar to "Results cleared"', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
      });

      await loadPanel();
      document.getElementById('clear-btn')!.click();

      expect(document.getElementById('status-bar')!.textContent).toBe('Results cleared');
    });

    it('uses RU strings in status bar when locale is "ru"', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: { locale: 'ru', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
      });

      await loadPanel();
      document.getElementById('clear-btn')!.click();

      expect(document.getElementById('status-bar')!.textContent).toBe('Результаты очищены');
    });
  });

  // -------------------------------------------------------------------------
  // Export button
  // -------------------------------------------------------------------------

  describe('export button', () => {
    it('shows "Run a scan first" when no scan has been performed', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
      });

      await loadPanel();
      document.getElementById('export-btn')!.click();

      expect(document.getElementById('status-bar')!.textContent).toBe('Run a scan first.');
    });

    it('exports JSON and shows "Exported as JSON" after a successful scan', async () => {
      // jsdom does not implement URL.createObjectURL; provide a stub
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = jest.fn().mockReturnValue('blob:mock');
      URL.revokeObjectURL = jest.fn();

      const result = buildScanResult({ issues: [] });

      (chrome.runtime.sendMessage as jest.Mock)
        .mockResolvedValueOnce({ success: true, settings: { locale: 'en', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' } })
        .mockResolvedValueOnce({ success: true, result });

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

    it('shows RU "Run a scan first" message when locale is "ru"', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        settings: { locale: 'ru', wcagLevel: 'AA', includeColorContrast: true, includeImages: true, includeKeyboard: true, includeSemantics: true, autoScanOnLoad: false, theme: 'light' },
      });

      await loadPanel();
      document.getElementById('export-btn')!.click();

      expect(document.getElementById('status-bar')!.textContent).toBe('Сначала выполните сканирование.');
    });
  });
});
