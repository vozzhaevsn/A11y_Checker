import { ScanResult, Settings, AccessibilityIssue } from '../types';
import { ExportUtil } from '../utils/export';
import type { AppLocale } from '../i18n/locale';
import { isAppLocale } from '../i18n/locale';
import {
  formatNoFilteredIssuesPlaceholder,
  getImpactLabel,
  getPopupUi,
  type ImpactKey,
} from '../i18n/messages';

class PopupUI {
  private scanBtn!: HTMLButtonElement;
  private clearBtn!: HTMLButtonElement;
  private settingsBtn!: HTMLButtonElement;
  private resultsContainer!: HTMLElement;
  private summaryContainer!: HTMLElement;
  private exportActions!: HTMLElement;
  private exportJsonBtn!: HTMLButtonElement;
  private exportHtmlBtn!: HTMLButtonElement;
  private exportCsvBtn!: HTMLButtonElement;
  private wcagLevelSelect!: HTMLSelectElement;
  private footerLabel!: HTMLElement;

  private settingsOverlay!: HTMLElement;
  private settingContrast!: HTMLInputElement;
  private settingImages!: HTMLInputElement;
  private settingSemantics!: HTMLInputElement;
  private settingKeyboard!: HTMLInputElement;
  private settingsSave!: HTMLButtonElement;
  private settingsCancel!: HTMLButtonElement;
  private settingLocale!: HTMLSelectElement;
  private settingLocaleLabel!: HTMLElement;

  private filterButtons!: NodeListOf<HTMLElement>;
  private activeFilter: string = 'all';

  private currentResult: ScanResult | null = null;
  private exporter = new ExportUtil();
  private uiLocale: AppLocale = 'en';

  constructor() {
    this.bindElements();
    this.initializeEventListeners();
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    await this.loadSettings();
    await this.loadLastScan();
  }

  private bindElements(): void {
    this.scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
    this.clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
    this.settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
    this.resultsContainer = document.getElementById('results-container') as HTMLElement;
    this.summaryContainer = document.getElementById('summary-container') as HTMLElement;
    this.exportActions = document.getElementById('export-actions') as HTMLElement;
    this.exportJsonBtn = document.getElementById('export-json-btn') as HTMLButtonElement;
    this.exportHtmlBtn = document.getElementById('export-html-btn') as HTMLButtonElement;
    this.exportCsvBtn = document.getElementById('export-csv-btn') as HTMLButtonElement;
    this.wcagLevelSelect = document.getElementById('wcag-level') as HTMLSelectElement;
    this.footerLabel = document.getElementById('footer-wcag-label') as HTMLElement;

    this.settingsOverlay = document.getElementById('settings-overlay') as HTMLElement;
    this.settingContrast = document.getElementById('setting-contrast') as HTMLInputElement;
    this.settingImages = document.getElementById('setting-images') as HTMLInputElement;
    this.settingSemantics = document.getElementById('setting-semantics') as HTMLInputElement;
    this.settingKeyboard = document.getElementById('setting-keyboard') as HTMLInputElement;
    this.settingsSave = document.getElementById('settings-save') as HTMLButtonElement;
    this.settingsCancel = document.getElementById('settings-cancel') as HTMLButtonElement;
    this.settingLocale = document.getElementById('setting-locale') as HTMLSelectElement;
    this.settingLocaleLabel = document.getElementById('setting-locale-label') as HTMLElement;

    this.filterButtons = document.querySelectorAll('.filter-btn') as NodeListOf<HTMLElement>;
  }

  private initializeEventListeners(): void {
    this.scanBtn.addEventListener('click', () => void this.runScan());
    this.clearBtn.addEventListener('click', () => void this.clearResults());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.exportJsonBtn.addEventListener('click', () => this.exportResults('json'));
    this.exportHtmlBtn.addEventListener('click', () => this.exportResults('html'));
    this.exportCsvBtn.addEventListener('click', () => this.exportResults('csv'));

    this.wcagLevelSelect.addEventListener('change', () => {
      const level = this.wcagLevelSelect.value as 'A' | 'AA' | 'AAA';
      const ui = getPopupUi(this.uiLocale);
      this.footerLabel.textContent = ui.footerWcag(level);
      void this.updateRemoteSettings({ wcagLevel: level });
    });

    this.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset['filter'] ?? 'all';
        if (this.currentResult) {
          this.renderIssuesList(this.currentResult.issues);
        }
      });
    });

    this.settingsSave.addEventListener('click', () => void this.saveSettings());
    this.settingsCancel.addEventListener('click', () => this.closeSettings());
    this.settingsOverlay.addEventListener('click', (e) => {
      if (e.target === this.settingsOverlay) this.closeSettings();
    });
  }

  /* ---------- settings ---------- */

  private async loadSettings(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response?.success && response.settings) {
        const s = response.settings as Settings;
        this.uiLocale = isAppLocale(s.locale) ? s.locale : 'en';
        this.wcagLevelSelect.value = s.wcagLevel;
        this.settingLocale.value = this.uiLocale;
        this.settingContrast.checked = s.includeColorContrast;
        this.settingImages.checked = s.includeImages;
        this.settingSemantics.checked = s.includeSemantics;
        this.settingKeyboard.checked = s.includeKeyboard;
        this.applyPopupUi();
      }
    } catch {
      /* use defaults */
    }
  }

  private applyPopupUi(): void {
    const ui = getPopupUi(this.uiLocale);
    document.documentElement.lang = this.uiLocale === 'ru' ? 'ru' : 'en';
    document.title = ui.documentTitle;

    (document.querySelector('.title') as HTMLElement).textContent = ui.appTitle;
    (document.getElementById('app-subtitle') as HTMLElement).textContent = ui.subtitle;

    this.scanBtn.textContent = ui.scanPage;
    this.clearBtn.textContent = ui.clear;
    this.settingsBtn.textContent = ui.settings;

    (document.querySelector('label[for="wcag-level"]') as HTMLElement).textContent = ui.wcagLevelLabel;

    this.filterButtons.forEach((btn) => {
      const f = btn.dataset['filter'];
      if (f === 'all') btn.textContent = ui.filterAll;
      else if (f === 'critical') btn.textContent = ui.filterCritical;
      else if (f === 'serious') btn.textContent = ui.filterSerious;
      else if (f === 'moderate') btn.textContent = ui.filterModerate;
      else if (f === 'minor') btn.textContent = ui.filterMinor;
    });

    const summaryLabels = ['summaryTotal', 'summaryCritical', 'summarySerious', 'summaryModerate', 'summaryMinor'] as const;
    document.querySelectorAll('#summary-container .summary-label').forEach((el, i) => {
      const key = summaryLabels[i];
      if (key) el.textContent = ui[key];
    });

    this.exportJsonBtn.textContent = ui.exportJson;
    this.exportHtmlBtn.textContent = ui.exportHtml;
    this.exportCsvBtn.textContent = ui.exportCsv;

    this.footerLabel.textContent = ui.footerWcag(this.wcagLevelSelect.value);

    (document.getElementById('settings-title') as HTMLElement).textContent = ui.settingsTitle;
    this.settingLocaleLabel.textContent = ui.settingLocaleLabel;
    (document.querySelector('label[for="setting-contrast"]') as HTMLElement).textContent = ui.settingContrast;
    (document.querySelector('label[for="setting-images"]') as HTMLElement).textContent = ui.settingImages;
    (document.querySelector('label[for="setting-semantics"]') as HTMLElement).textContent = ui.settingSemantics;
    (document.querySelector('label[for="setting-keyboard"]') as HTMLElement).textContent = ui.settingKeyboard;
    this.settingsCancel.textContent = ui.settingsCancel;
    this.settingsSave.textContent = ui.settingsSave;
  }

  private openSettings(): void {
    this.settingsOverlay.classList.add('visible');
  }

  private closeSettings(): void {
    this.settingsOverlay.classList.remove('visible');
  }

  private async saveSettings(): Promise<void> {
    const loc = this.settingLocale.value;
    this.uiLocale = isAppLocale(loc) ? loc : 'en';
    const partial: Partial<Settings> = {
      wcagLevel: this.wcagLevelSelect.value as 'A' | 'AA' | 'AAA',
      locale: this.uiLocale,
      includeColorContrast: this.settingContrast.checked,
      includeImages: this.settingImages.checked,
      includeSemantics: this.settingSemantics.checked,
      includeKeyboard: this.settingKeyboard.checked,
    };
    await this.updateRemoteSettings(partial);
    this.applyPopupUi();
    if (this.currentResult) {
      this.renderIssuesList(this.currentResult.issues);
    }
    this.closeSettings();
  }

  private async updateRemoteSettings(partial: Partial<Settings>): Promise<void> {
    try {
      await chrome.runtime.sendMessage({ action: 'updateSettings', payload: partial });
    } catch {
      console.error('Failed to update settings in background');
    }
  }

  /* ---------- scan ---------- */

  private async loadLastScan(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getLastScan' });
      if (response?.success && response.result) {
        this.currentResult = response.result as ScanResult;
        this.displayResults(this.currentResult);
      }
    } catch {
      /* ignore */
    }
  }

  private async runScan(): Promise<void> {
    try {
      this.setLoadingState(true);
      this.clearResultsUI();

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/scripts/content-script.js'],
        });
      } catch {
        /* content script may already be present */
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scan' });

      if (!response?.success) throw new Error(response?.error ?? 'Scan failed');

      this.currentResult = response.result as ScanResult;
      this.displayResults(this.currentResult);
    } catch (error) {
      console.error('Scan failed:', error);
      const ui = getPopupUi(this.uiLocale);
      this.resultsContainer.innerHTML = `<p class="placeholder">${this.escapeHtml(ui.errorPrefix)} ${this.escapeHtml((error as Error).message)}</p>`;
      this.summaryContainer.style.display = 'none';
      this.exportActions.style.display = 'none';
    } finally {
      this.setLoadingState(false);
    }
  }

  /* ---------- clear ---------- */

  private async clearResults(): Promise<void> {
    this.currentResult = null;
    this.summaryContainer.style.display = 'none';
    this.exportActions.style.display = 'none';
    const ui = getPopupUi(this.uiLocale);
    this.resultsContainer.innerHTML = `<p class="placeholder">${this.escapeHtml(ui.placeholderInitial)}</p>`;

    try {
      await chrome.runtime.sendMessage({ action: 'clearResults' });
    } catch {
      /* ignore */
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, { action: 'removeHighlights' });
      }
    } catch {
      /* ignore */
    }
  }

  /* ---------- display ---------- */

  private displayResults(result: ScanResult): void {
    this.summaryContainer.style.display = 'grid';
    this.exportActions.style.display = 'flex';

    (document.getElementById('total-count') as HTMLElement).textContent = String(result.summary.total);
    (document.getElementById('critical-count') as HTMLElement).textContent = String(result.summary.critical);
    (document.getElementById('serious-count') as HTMLElement).textContent = String(result.summary.serious);
    (document.getElementById('moderate-count') as HTMLElement).textContent = String(result.summary.moderate);
    (document.getElementById('minor-count') as HTMLElement).textContent = String(result.summary.minor);

    this.renderIssuesList(result.issues);
  }

  private renderIssuesList(issues: AccessibilityIssue[]): void {
    this.resultsContainer.innerHTML = '';

    const filtered =
      this.activeFilter === 'all'
        ? issues
        : issues.filter((i) => i.impact === this.activeFilter);

    if (filtered.length === 0) {
      const ui = getPopupUi(this.uiLocale);
      this.resultsContainer.innerHTML =
        this.activeFilter === 'all'
          ? `<p class="placeholder">${this.escapeHtml(ui.placeholderNoIssues)}</p>`
          : `<p class="placeholder">${this.escapeHtml(formatNoFilteredIssuesPlaceholder(this.uiLocale, this.activeFilter))}</p>`;
      return;
    }

    filtered.forEach((issue) => {
      const item = document.createElement('div');
      item.className = `issue-item ${issue.impact}`;

      const selector = this.buildSelector(issue);

      const ui = getPopupUi(this.uiLocale);
      const impactLabel = getImpactLabel(this.uiLocale, issue.impact as ImpactKey);
      item.innerHTML = `
        <div class="issue-header">
          <span class="issue-description">${this.escapeHtml(issue.description)}</span>
          <span class="issue-impact ${issue.impact}">${this.escapeHtml(impactLabel)}</span>
        </div>
        <div class="issue-element">&lt;${this.escapeHtml(issue.element.tagName)}${
          issue.element.id ? ` id="${this.escapeHtml(issue.element.id)}"` : ''
        }${issue.element.className ? ` class="${this.escapeHtml(issue.element.className)}"` : ''}&gt;</div>
        <div class="issue-wcag">${this.escapeHtml(ui.issueWcagPrefix)} ${issue.wcagCriteria.join(', ')}</div>
        <div class="issue-details">
          <div class="help-text">${this.escapeHtml(issue.help)}</div>
          ${
            issue.fixSuggestions.length
              ? `<ul class="fix-suggestions">${issue.fixSuggestions.map((s) => `<li>${this.escapeHtml(s)}</li>`).join('')}</ul>`
              : ''
          }
        </div>
      `;

      item.addEventListener('click', () => {
        item.classList.toggle('expanded');
        void this.navigateToElement(selector);
      });

      this.resultsContainer.appendChild(item);
    });
  }

  private buildSelector(issue: AccessibilityIssue): string {
    if (issue.element.id) return `#${issue.element.id}`;
    let sel = issue.element.tagName;
    if (issue.element.className) {
      sel += '.' + issue.element.className.trim().split(/\s+/).join('.');
    }
    return sel;
  }

  private async navigateToElement(selector: string): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, { action: 'highlightElement', selector });
      }
    } catch {
      /* ignore */
    }
  }

  /* ---------- export ---------- */

  private exportResults(format: 'json' | 'html' | 'csv'): void {
    if (!this.currentResult) return;

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
        content = this.exporter.exportAsHtml(this.currentResult, this.uiLocale);
        mime = 'text/html';
        extension = 'html';
        break;
      case 'csv':
        content = this.exporter.exportAsCsv(this.currentResult, this.uiLocale);
        mime = 'text/csv';
        extension = 'csv';
        break;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `a11y-report-${new Date(this.currentResult.timestamp).toISOString().slice(0, 10)}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------- helpers ---------- */

  private setLoadingState(isLoading: boolean): void {
    const ui = getPopupUi(this.uiLocale);
    this.scanBtn.disabled = isLoading;
    this.scanBtn.textContent = isLoading ? ui.scanning : ui.scanPage;
  }

  private clearResultsUI(): void {
    const ui = getPopupUi(this.uiLocale);
    this.resultsContainer.innerHTML = `<p class="placeholder">${this.escapeHtml(ui.placeholderScanning)}</p>`;
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

new PopupUI();
