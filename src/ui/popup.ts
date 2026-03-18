import { ScanResult } from '../types';
import { ExportUtil } from '../utils/export';

class PopupUI {
  private scanBtn: HTMLButtonElement;
  private settingsBtn: HTMLButtonElement;
  private resultsContainer: HTMLElement;
  private summaryContainer: HTMLElement;
  private exportActions: HTMLElement;
  private exportJsonBtn: HTMLButtonElement;
  private exportHtmlBtn: HTMLButtonElement;
  private exportCsvBtn: HTMLButtonElement;

  private currentResult: ScanResult | null = null;
  private exporter = new ExportUtil();

  constructor() {
    this.scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
    this.settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
    this.resultsContainer = document.getElementById('results-container') as HTMLElement;
    this.summaryContainer = document.getElementById('summary-container') as HTMLElement;
    this.exportActions = document.getElementById('export-actions') as HTMLElement;
    this.exportJsonBtn = document.getElementById('export-json-btn') as HTMLButtonElement;
    this.exportHtmlBtn = document.getElementById('export-html-btn') as HTMLButtonElement;
    this.exportCsvBtn = document.getElementById('export-csv-btn') as HTMLButtonElement;

    this.initializeEventListeners();
    this.loadLastScan();
  }

  private initializeEventListeners(): void {
    this.scanBtn.addEventListener('click', () => void this.runScan());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.exportJsonBtn.addEventListener('click', () => this.exportResults('json'));
    this.exportHtmlBtn.addEventListener('click', () => this.exportResults('html'));
    this.exportCsvBtn.addEventListener('click', () => this.exportResults('csv'));
  }

  private async loadLastScan(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getLastScan' });

      if (response?.success && response.result) {
        const result = response.result as ScanResult;
        this.currentResult = result;
        this.displayResults(result);
      }
    } catch (error) {
      console.error('Failed to load last scan:', error);
    }
  }

  private async runScan(): Promise<void> {
    try {
      this.setLoadingState(true);
      this.clearResultsUI();

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Гарантированно инжектим content-script в активную вкладку
      try {
        const scripting = (chrome as any).scripting;
        if (scripting?.executeScript) {
          await scripting.executeScript({
            target: { tabId: tab.id },
            files: ['src/scripts/content-script.js'],
          });
        }
      } catch (e) {
        console.warn('Failed to inject content script via chrome.scripting:', e);
      }

      // Теперь отправляем сообщение на content-script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scan' });

      if (!response?.success) {
        throw new Error(response?.error ?? 'Scan failed');
      }

      const result = response.result as ScanResult;
      this.currentResult = result;
      this.displayResults(result);
    } catch (error) {
      console.error('Scan failed:', error);
      this.resultsContainer.innerHTML =
        `<p class="placeholder">Ошибка при выполнении проверки: ${(error as Error).message}</p>`;
      this.summaryContainer.style.display = 'none';
      this.exportActions.style.display = 'none';
    } finally {
      this.setLoadingState(false);
    }
  }

  private displayResults(result: ScanResult): void {
    // Обновляем сводку
    this.summaryContainer.style.display = 'grid';
    this.exportActions.style.display = 'flex';

    (document.getElementById('total-count') as HTMLElement).textContent =
      String(result.summary.total);
    (document.getElementById('critical-count') as HTMLElement).textContent =
      String(result.summary.critical);
    (document.getElementById('serious-count') as HTMLElement).textContent =
      String(result.summary.serious);
    (document.getElementById('moderate-count') as HTMLElement).textContent =
      String(result.summary.moderate);
    (document.getElementById('minor-count') as HTMLElement).textContent =
      String(result.summary.minor);

    // Рендерим список проблем
    this.resultsContainer.innerHTML = '';

    if (result.issues.length === 0) {
      this.resultsContainer.innerHTML =
        '<p class="placeholder">Проблем доступности не обнаружено.</p>';
      return;
    }

    result.issues.forEach((issue) => {
      const item = document.createElement('div');
      item.className = `issue-item ${issue.impact}`;

      item.innerHTML = `
        <div class="issue-header">
          <span class="issue-description">${issue.description}</span>
          <span class="issue-impact">${issue.impact.toUpperCase()}</span>
        </div>
        <div class="issue-element">
          &lt;${issue.element.tagName}${
            issue.element.id ? ` id="${issue.element.id}"` : ''
          }${issue.element.className ? ` class="${issue.element.className}"` : ''}&gt;
        </div>
      `;

      this.resultsContainer.appendChild(item);
    });
  }

  private exportResults(format: 'json' | 'html' | 'csv'): void {
    if (!this.currentResult) {
      console.warn('Nothing to export, no scan results available');
      return;
    }

    let content: string;
    let mime: string;
    let extension: string;

    switch (format) {
      case 'json':
        content = this.exporter.exportAsJson(this.currentResult);
        mime = 'application/json';
        extension = 'json';
        break;
      case 'html':
        content = this.exporter.exportAsHtml(this.currentResult);
        mime = 'text/html';
        extension = 'html';
        break;
      case 'csv':
        content = this.exporter.exportAsCsv(this.currentResult);
        mime = 'text/csv';
        extension = 'csv';
        break;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `a11y-report-${new Date(this.currentResult.timestamp)
      .toISOString()
      .slice(0, 10)}.${extension}`;
    a.click();

    URL.revokeObjectURL(url);
  }

  private openSettings(): void {
    // Пока options_page не реализован, просто не делаем ничего,
    // чтобы не было ошибки "Could not create an options page"
    // chrome.runtime.openOptionsPage?.();
    console.log('Settings page is not implemented yet');
  }

  private setLoadingState(isLoading: boolean): void {
    this.scanBtn.disabled = isLoading;
    this.scanBtn.textContent = isLoading ? 'Выполняется...' : 'Запустить проверку';
  }

  private clearResultsUI(): void {
    this.resultsContainer.innerHTML =
      '<p class="placeholder">Выполняется проверка доступности...</p>';
  }
}

new PopupUI();
