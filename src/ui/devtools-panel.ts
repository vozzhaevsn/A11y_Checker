import { ScanResult, Settings } from '../types';
import { ExportUtil } from '../utils/export';
import type { AppLocale } from '../i18n/locale';
import { isAppLocale } from '../i18n/locale';
import { getDevToolsUi, getImpactLabel, type ImpactKey } from '../i18n/messages';

class DevToolsPanelUI {
  private resultsContainer: HTMLElement;
  private scanBtn: HTMLButtonElement;
  private exportBtn: HTMLButtonElement;
  private clearBtn: HTMLButtonElement;
  private statusBar: HTMLElement;
  private scanResult: ScanResult | null = null;
  private exporter = new ExportUtil();
  private uiLocale: AppLocale = 'en';

  constructor() {
    this.resultsContainer = document.getElementById('results-container') as HTMLElement;
    this.scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
    this.exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
    this.clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
    this.statusBar = document.getElementById('status-bar') as HTMLElement;

    this.initializeEventListeners();
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    await this.loadLocale();
    this.applyUiStrings();
    this.updateStatusBar(getDevToolsUi(this.uiLocale).readyToScan);
  }

  private async loadLocale(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response?.success && response.settings) {
        const s = response.settings as Settings;
        this.uiLocale = isAppLocale(s.locale) ? s.locale : 'en';
      }
    } catch {
      /* default en */
    }
  }

  private applyUiStrings(): void {
    const t = getDevToolsUi(this.uiLocale);
    document.documentElement.lang = this.uiLocale === 'ru' ? 'ru' : 'en';
    document.title = t.documentTitle;
    this.scanBtn.textContent = t.runScan;
    this.exportBtn.textContent = t.exportJson;
    this.clearBtn.textContent = t.clear;
  }

  private initializeEventListeners(): void {
    this.scanBtn.addEventListener('click', () => void this.runScan());
    this.exportBtn.addEventListener('click', () => this.exportResults());
    this.clearBtn.addEventListener('click', () => this.clearResults());
  }

  private async runScan(): Promise<void> {
    const t = getDevToolsUi(this.uiLocale);
    this.updateStatusBar(t.runningScan);

    const tabId = chrome.devtools.inspectedWindow.tabId;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'devtoolsScan',
        tabId,
      });

      if (!response?.success) {
        this.updateStatusBar(`${t.scanFailed} ${response?.error ?? t.unknownError}`);
        return;
      }

      this.scanResult = response.result as ScanResult;
      this.renderResults(this.scanResult);
      this.updateStatusBar(
        t.foundIssues(this.scanResult.summary.total, this.scanResult.summary.critical),
      );
    } catch (error) {
      console.error(error);
      this.updateStatusBar(`${t.scanFailed} ${(error as Error).message}`);
    }
  }

  private renderResults(result: ScanResult): void {
    const t = getDevToolsUi(this.uiLocale);
    this.resultsContainer.innerHTML = '';

    if (result.issues.length === 0) {
      this.resultsContainer.innerHTML = `<p>${this.escapeHtml(t.noIssuesFound)}</p>`;
      return;
    }

    result.issues.forEach((issue) => {
      const item = document.createElement('div');
      item.className = `result-item`;

      const impactLabel = getImpactLabel(this.uiLocale, issue.impact as ImpactKey);
      item.innerHTML = `
        <div class="result-header">
          <span class="${issue.impact}">${this.escapeHtml(impactLabel)}</span>
          <span class="element-tag">${issue.element.tagName}${issue.element.id ? `#${issue.element.id}` : ''}</span>
        </div>
        <div class="description">${this.escapeHtml(issue.description)}</div>
        <div class="wcag">${this.escapeHtml(t.wcagPrefix)} ${issue.wcagCriteria.join(', ')}</div>
      `;

      this.resultsContainer.appendChild(item);
    });
  }

  private exportResults(): void {
    const t = getDevToolsUi(this.uiLocale);
    if (!this.scanResult) {
      this.updateStatusBar(t.runScanFirst);
      return;
    }

    const json = this.exporter.exportAsJson(this.scanResult);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `a11y-devtools-${new Date(this.scanResult.timestamp).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.updateStatusBar(t.exportedJson);
  }

  private clearResults(): void {
    const t = getDevToolsUi(this.uiLocale);
    this.scanResult = null;
    this.resultsContainer.innerHTML = `<p>${this.escapeHtml(t.noResultsYet)}</p>`;
    this.updateStatusBar(t.resultsCleared);
  }

  private updateStatusBar(message: string): void {
    this.statusBar.textContent = message;
  }

  private escapeHtml(str: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, (c) => map[c] ?? c);
  }
}

new DevToolsPanelUI();
