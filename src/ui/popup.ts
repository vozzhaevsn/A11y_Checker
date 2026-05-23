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
  private themeBtn!: HTMLButtonElement;
  private diffBtn!: HTMLButtonElement;
  private resultsContainer!: HTMLElement;
  private historyContainer!: HTMLElement;
  private summaryContainer!: HTMLElement;
  private exportActions!: HTMLElement;
  private exportJsonBtn!: HTMLButtonElement;
  private exportHtmlBtn!: HTMLButtonElement;
  private exportCsvBtn!: HTMLButtonElement;
  private wcagLevelSelect!: HTMLSelectElement;
  private wcagCriterionSelect!: HTMLSelectElement;
  private footerLabel!: HTMLElement;

  private settingsOverlay!: HTMLElement;
  private settingContrast!: HTMLInputElement;
  private settingImages!: HTMLInputElement;
  private settingSemantics!: HTMLInputElement;
  private settingKeyboard!: HTMLInputElement;
  private settingAutoScan!: HTMLInputElement;
  private settingWatchDom!: HTMLInputElement;
  private settingTheme!: HTMLInputElement;
  private settingsSave!: HTMLButtonElement;
  private settingsCancel!: HTMLButtonElement;
  private settingLocale!: HTMLSelectElement;
  private settingLocaleLabel!: HTMLElement;

  private filterButtons!: NodeListOf<HTMLElement>;
  private tabButtons!: NodeListOf<HTMLElement>;
  private activeFilter: string = 'all';
  private activeCriterion: string = 'all';
  private activeTab: string = 'issues';

  private currentResult: ScanResult | null = null;
  private diffMode: 'diff' | 'normal' = 'normal';
  private diffPrevious: ScanResult | null = null;
  private exporter = new ExportUtil();
  private uiLocale: AppLocale = 'en';
  private currentPage: number = 1;
  private readonly pageSize: number = 20;

  private paginationContainer!: HTMLElement;
  private paginationPrev!: HTMLButtonElement;
  private paginationNext!: HTMLButtonElement;
  private paginationInfo!: HTMLElement;

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
    this.themeBtn = document.getElementById('theme-btn') as HTMLButtonElement;
    this.diffBtn = document.getElementById('diff-btn') as HTMLButtonElement;
    this.resultsContainer = document.getElementById('results-container') as HTMLElement;
    this.historyContainer = document.getElementById('history-container') as HTMLElement;
    this.summaryContainer = document.getElementById('summary-container') as HTMLElement;
    this.exportActions = document.getElementById('export-actions') as HTMLElement;
    this.exportJsonBtn = document.getElementById('export-json-btn') as HTMLButtonElement;
    this.exportHtmlBtn = document.getElementById('export-html-btn') as HTMLButtonElement;
    this.exportCsvBtn = document.getElementById('export-csv-btn') as HTMLButtonElement;
    this.wcagLevelSelect = document.getElementById('wcag-level') as HTMLSelectElement;
    this.wcagCriterionSelect = document.getElementById('wcag-criterion-filter') as HTMLSelectElement;
    this.footerLabel = document.getElementById('footer-wcag-label') as HTMLElement;

    this.settingsOverlay = document.getElementById('settings-overlay') as HTMLElement;
    this.settingContrast = document.getElementById('setting-contrast') as HTMLInputElement;
    this.settingImages = document.getElementById('setting-images') as HTMLInputElement;
    this.settingSemantics = document.getElementById('setting-semantics') as HTMLInputElement;
    this.settingKeyboard = document.getElementById('setting-keyboard') as HTMLInputElement;
    this.settingAutoScan = document.getElementById('setting-auto-scan') as HTMLInputElement;
    this.settingWatchDom = document.getElementById('setting-watch-dom') as HTMLInputElement;
    this.settingTheme = document.getElementById('setting-theme') as HTMLInputElement;
    this.settingsSave = document.getElementById('settings-save') as HTMLButtonElement;
    this.settingsCancel = document.getElementById('settings-cancel') as HTMLButtonElement;
    this.settingLocale = document.getElementById('setting-locale') as HTMLSelectElement;
    this.settingLocaleLabel = document.getElementById('setting-locale-label') as HTMLElement;
    this.paginationContainer = document.getElementById('pagination-container') as HTMLElement;
    this.paginationPrev = document.getElementById('pagination-prev') as HTMLButtonElement;
    this.paginationNext = document.getElementById('pagination-next') as HTMLButtonElement;
    this.paginationInfo = document.getElementById('pagination-info') as HTMLElement;

    this.filterButtons = document.querySelectorAll('.filter-btn') as NodeListOf<HTMLElement>;
    this.tabButtons = document.querySelectorAll('.tab-btn') as NodeListOf<HTMLElement>;
  }

  private initializeEventListeners(): void {
    this.scanBtn.addEventListener('click', () => void this.runScan());
    this.clearBtn.addEventListener('click', () => void this.clearResults());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.themeBtn.addEventListener('click', () => this.toggleTheme());
    this.diffBtn.addEventListener('click', () => void this.toggleDiff());
    this.exportJsonBtn.addEventListener('click', () => this.exportResults('json'));
    this.exportHtmlBtn.addEventListener('click', () => this.exportResults('html'));
    this.exportCsvBtn.addEventListener('click', () => this.exportResults('csv'));

    this.wcagLevelSelect.addEventListener('change', () => {
      const level = this.wcagLevelSelect.value as 'A' | 'AA' | 'AAA';
      const ui = getPopupUi(this.uiLocale);
      this.footerLabel.textContent = ui.footerWcag(level);
      void this.updateRemoteSettings({ wcagLevel: level });
    });

    this.wcagCriterionSelect.addEventListener('change', () => {
      this.activeCriterion = this.wcagCriterionSelect.value;
      this.currentPage = 1;
      if (this.currentResult) this.renderIssuesList(this.currentResult.issues);
    });

    this.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset['filter'] ?? 'all';
        this.currentPage = 1;
        if (this.currentResult) this.renderIssuesList(this.currentResult.issues);
      });
    });

    this.tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.tabButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.dataset['tab'] ?? 'issues';
        this.switchTab();
      });
    });

    this.settingsSave.addEventListener('click', () => void this.saveSettings());
    this.settingsCancel.addEventListener('click', () => this.closeSettings());
    this.settingsOverlay.addEventListener('click', (e) => {
      if (e.target === this.settingsOverlay) this.closeSettings();
    });

    this.paginationPrev.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        if (this.currentResult) this.renderIssuesList(this.currentResult.issues);
      }
    });
    this.paginationNext.addEventListener('click', () => {
      if (this.currentResult) {
        const groups = this.computeGroups(this.currentResult.issues);
        const totalPages = Math.ceil(groups.length / this.pageSize) || 1;
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderIssuesList(this.currentResult.issues);
        }
      }
    });
  }

  /* ---------- theme ---------- */

  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
  }

  private toggleTheme(): void {
    const current = document.documentElement.getAttribute('data-theme');
    const next: 'light' | 'dark' = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    this.settingTheme.checked = next === 'dark';
    void this.updateRemoteSettings({ theme: next });
  }

  /* ---------- tabs ---------- */

  private switchTab(): void {
    if (this.activeTab === 'history') {
      this.resultsContainer.style.display = 'none';
      this.summaryContainer.style.display = 'none';
      this.exportActions.style.display = 'none';
      this.paginationContainer.style.display = 'none';
      this.historyContainer.style.display = 'block';
      void this.renderHistory();
    } else {
      this.historyContainer.style.display = 'none';
      this.resultsContainer.style.display = 'block';
      if (this.currentResult) {
        this.summaryContainer.style.display = 'grid';
        this.exportActions.style.display = 'flex';
      }
    }
  }

  private async renderHistory(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getAllScans' });
      if (!response?.success || !Array.isArray(response.results)) {
        this.historyContainer.innerHTML = `<p class="placeholder">${this.escapeHtml(getPopupUi(this.uiLocale).historyEmpty)}</p>`;
        return;
      }
      const results: ScanResult[] = (response.results as ScanResult[]).slice(0, 10);
      if (results.length === 0) {
        this.historyContainer.innerHTML = `<p class="placeholder">${this.escapeHtml(getPopupUi(this.uiLocale).historyEmpty)}</p>`;
        return;
      }
      this.historyContainer.innerHTML = '';
      results.forEach((r) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        const ago = this.timeAgo(r.timestamp);
        const badgeClass = r.summary.critical > 0 ? '' : 'zero';
        const badgeText = r.summary.critical > 0
          ? `${r.summary.critical} critical`
          : `${r.summary.total} issues`;
        item.innerHTML = `
          <span class="history-url" title="${this.escapeHtml(r.url)}">${this.escapeHtml(r.url)}</span>
          <span class="history-meta">${this.escapeHtml(ago)}</span>
          <span class="history-badge ${badgeClass}">${this.escapeHtml(badgeText)}</span>
        `;
        item.addEventListener('click', () => {
          this.currentResult = r;
          this.tabButtons.forEach((b) => b.classList.remove('active'));
          (document.getElementById('tab-issues') as HTMLElement).classList.add('active');
          this.activeTab = 'issues';
          this.switchTab();
          this.displayResults(r);
        });
        this.historyContainer.appendChild(item);
      });
    } catch {
      this.historyContainer.innerHTML = `<p class="placeholder">${this.escapeHtml(getPopupUi(this.uiLocale).historyEmpty)}</p>`;
    }
  }

  private timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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
        this.settingAutoScan.checked = s.autoScanOnLoad;
        this.settingWatchDom.checked = s.watchDomChanges;
        this.settingTheme.checked = s.theme === 'dark';
        this.applyTheme(s.theme ?? 'light');
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

    (document.getElementById('tab-issues') as HTMLElement).textContent = ui.tabIssues;
    (document.getElementById('tab-history') as HTMLElement).textContent = ui.tabHistory;

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
    (document.getElementById('setting-theme-label') as HTMLElement).textContent = ui.settingTheme;
    (document.getElementById('setting-auto-scan-label') as HTMLElement).textContent = ui.settingAutoScan;
    (document.getElementById('setting-watch-dom-label') as HTMLElement).textContent = ui.settingWatchDom;
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
    const theme: 'light' | 'dark' = this.settingTheme.checked ? 'dark' : 'light';
    this.applyTheme(theme);
    const partial: Partial<Settings> = {
      wcagLevel: this.wcagLevelSelect.value as 'A' | 'AA' | 'AAA',
      locale: this.uiLocale,
      includeColorContrast: this.settingContrast.checked,
      includeImages: this.settingImages.checked,
      includeSemantics: this.settingSemantics.checked,
      includeKeyboard: this.settingKeyboard.checked,
      autoScanOnLoad: this.settingAutoScan.checked,
      watchDomChanges: this.settingWatchDom.checked,
      theme,
    };
    await this.updateRemoteSettings(partial);
    this.applyPopupUi();
    if (this.currentResult) this.renderIssuesList(this.currentResult.issues);
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
    this.currentPage = 1;
    this.diffBtn.style.display = 'none';
    this.paginationContainer.style.display = 'none';
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

  /* ---------- diff ---------- */

  private issueKey(issue: AccessibilityIssue): string {
    return this.buildSelector(issue) + '|' + (issue.wcagCriteria[0] ?? issue.id);
  }

  private async findPreviousScan(url: string, currentId: string): Promise<ScanResult | null> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getAllScans' });
      if (!response?.success || !Array.isArray(response.results)) return null;
      return (response.results as ScanResult[]).find(
        (r) => r.url === url && r.id !== currentId,
      ) ?? null;
    } catch {
      return null;
    }
  }

  private async toggleDiff(): Promise<void> {
    if (this.diffMode === 'diff') {
      this.diffMode = 'normal';
      const ui = getPopupUi(this.uiLocale);
      this.diffBtn.textContent = ui.diffCompare;
      if (this.currentResult) this.displayResults(this.currentResult);
      return;
    }

    if (!this.currentResult) return;

    const prev = await this.findPreviousScan(this.currentResult.url, this.currentResult.id);
    if (!prev) return;

    this.diffMode = 'diff';
    this.diffPrevious = prev;
    const ui = getPopupUi(this.uiLocale);
    this.diffBtn.textContent = ui.diffExit;
    this.renderDiffView(prev, this.currentResult);
  }

  private renderDiffView(prev: ScanResult, curr: ScanResult): void {
    this.summaryContainer.style.display = 'block';
    this.exportActions.style.display = 'flex';

    const prevKeys = new Set(prev.issues.map((i) => this.issueKey(i)));
    const currKeys = new Set(curr.issues.map((i) => this.issueKey(i)));

    const newIssues = curr.issues.filter((i) => !prevKeys.has(this.issueKey(i)));
    const fixedIssues = prev.issues.filter((i) => !currKeys.has(this.issueKey(i)));
    const unchanged = curr.issues.filter((i) => prevKeys.has(this.issueKey(i)));

    this.resultsContainer.innerHTML = '';

    const ui = getPopupUi(this.uiLocale);
    const summary = document.createElement('div');
    summary.className = 'diff-summary';
    summary.innerHTML = `<p>${this.escapeHtml(ui.diffSummary(newIssues.length, fixedIssues.length, unchanged.length))}</p>`;
    this.resultsContainer.appendChild(summary);

    const legend = document.createElement('div');
    legend.className = 'diff-legend';
    legend.innerHTML = `
      <span class="diff-legend-item diff-new">${this.escapeHtml(ui.diffNew)}</span>
      <span class="diff-legend-item diff-fixed">${this.escapeHtml(ui.diffFixed)}</span>
      <span class="diff-legend-item diff-unchanged">${this.escapeHtml(ui.diffUnchanged)}</span>
    `;
    this.resultsContainer.appendChild(legend);

    const renderSection = (title: string, issues: AccessibilityIssue[], cssClass: string) => {
      if (issues.length === 0) return;
      const section = document.createElement('div');
      section.className = 'diff-section';
      const h3 = document.createElement('h3');
      h3.className = `diff-section-title ${cssClass}`;
      h3.textContent = `${title} (${issues.length})`;
      section.appendChild(h3);
      issues.forEach((issue) => {
        const selector = this.buildSelector(issue);
        const card = this.buildIssueCard(issue, selector);
        card.classList.add(cssClass);
        section.appendChild(card);
      });
      this.resultsContainer.appendChild(section);
    };

    renderSection(ui.diffNew, newIssues, 'diff-new');
    renderSection(ui.diffFixed, fixedIssues, 'diff-fixed');
    renderSection(ui.diffUnchanged, unchanged, 'diff-unchanged');

    this.paginationContainer.style.display = 'none';
  }

  /* ---------- display ---------- */

  private displayResults(result: ScanResult): void {
    this.diffMode = 'normal';
    this.summaryContainer.style.display = 'grid';
    this.exportActions.style.display = 'flex';

    void this.findPreviousScan(result.url, result.id).then((prev) => {
      if (prev) {
        const ui = getPopupUi(this.uiLocale);
        this.diffBtn.textContent = ui.diffCompare;
        this.diffBtn.style.display = '';
      } else {
        this.diffBtn.style.display = 'none';
      }
    });

    (document.getElementById('total-count') as HTMLElement).textContent = String(result.summary.total);
    (document.getElementById('critical-count') as HTMLElement).textContent = String(result.summary.critical);
    (document.getElementById('serious-count') as HTMLElement).textContent = String(result.summary.serious);
    (document.getElementById('moderate-count') as HTMLElement).textContent = String(result.summary.moderate);
    (document.getElementById('minor-count') as HTMLElement).textContent = String(result.summary.minor);

    this.populateCriterionFilter(result.issues);
    this.renderIssuesList(result.issues);
  }

  private populateCriterionFilter(issues: AccessibilityIssue[]): void {
    const ui = getPopupUi(this.uiLocale);
    const criteria = new Set<string>();
    issues.forEach((i) => i.wcagCriteria.forEach((c) => criteria.add(c)));

    this.wcagCriterionSelect.innerHTML = `<option value="all">${this.escapeHtml(ui.wcagCriterionAll)}</option>`;
    Array.from(criteria).sort().forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      this.wcagCriterionSelect.appendChild(opt);
    });
    this.activeCriterion = 'all';
    this.wcagCriterionSelect.value = 'all';
  }

  private computeGroups(issues: AccessibilityIssue[]): Array<{ selector: string; issues: AccessibilityIssue[] }> {
    let filtered = this.activeFilter === 'all'
      ? issues
      : issues.filter((i) => i.impact === this.activeFilter);

    if (this.activeCriterion !== 'all') {
      filtered = filtered.filter((i) => i.wcagCriteria.includes(this.activeCriterion));
    }

    const groups = new Map<string, AccessibilityIssue[]>();
    filtered.forEach((issue) => {
      const key = this.buildSelector(issue);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(issue);
    });

    return Array.from(groups.entries()).map(([selector, groupIssues]) => ({ selector, issues: groupIssues }));
  }

  private renderIssuesList(issues: AccessibilityIssue[]): void {
    this.resultsContainer.innerHTML = '';

    const groups = this.computeGroups(issues);

    if (groups.length === 0) {
      const ui = getPopupUi(this.uiLocale);
      this.resultsContainer.innerHTML =
        this.activeFilter === 'all'
          ? `<p class="placeholder">${this.escapeHtml(ui.placeholderNoIssues)}</p>`
          : `<p class="placeholder">${this.escapeHtml(formatNoFilteredIssuesPlaceholder(this.uiLocale, this.activeFilter))}</p>`;
      this.paginationContainer.style.display = 'none';
      return;
    }

    const totalPages = Math.ceil(groups.length / this.pageSize);
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const start = (this.currentPage - 1) * this.pageSize;
    const pageGroups = groups.slice(start, start + this.pageSize);

    pageGroups.forEach(({ selector, issues: groupIssues }) => {
      if (groupIssues.length === 1) {
        this.resultsContainer.appendChild(this.buildIssueCard(groupIssues[0], selector));
      } else {
        const group = document.createElement('div');
        group.className = 'element-group';

        const header = document.createElement('div');
        header.className = 'element-group-header';
        header.innerHTML = `<span>${this.escapeHtml(selector)}</span><span>${groupIssues.length} issues</span>`;
        group.appendChild(header);

        const body = document.createElement('div');
        body.className = 'element-group-body';
        groupIssues.forEach((issue) => body.appendChild(this.buildIssueCard(issue, selector)));
        group.appendChild(body);

        this.resultsContainer.appendChild(group);
      }
    });

    if (totalPages > 1) {
      this.paginationContainer.style.display = 'flex';
      const ui = getPopupUi(this.uiLocale);
      this.paginationPrev.disabled = this.currentPage <= 1;
      this.paginationNext.disabled = this.currentPage >= totalPages;
      this.paginationInfo.textContent = ui.paginationPage(this.currentPage, totalPages);
    } else {
      this.paginationContainer.style.display = 'none';
    }
  }

  private buildIssueCard(issue: AccessibilityIssue, selector: string): HTMLElement {
    const item = document.createElement('div');
    item.className = `issue-item ${this.escapeHtml(issue.impact)}`;

    const ui = getPopupUi(this.uiLocale);
    const impactLabel = getImpactLabel(this.uiLocale, issue.impact as ImpactKey);

    const wcagChips = issue.wcagCriteria.map((c) =>
      `<span class="wcag-chip" title="${this.escapeHtml(c)}">${this.escapeHtml(c)}</span>`
    ).join('');

    item.innerHTML = `
      <div class="issue-header">
        <span class="issue-description">${this.escapeHtml(issue.description)}</span>
        <span class="issue-impact ${this.escapeHtml(issue.impact)}">${this.escapeHtml(impactLabel)}</span>
      </div>
      <div class="issue-element">&lt;${this.escapeHtml(issue.element.tagName)}${
        issue.element.id ? ` id="${this.escapeHtml(issue.element.id)}"` : ''
      }${issue.element.className ? ` class="${this.escapeHtml(issue.element.className)}"` : ''}&gt;</div>
      <div class="issue-wcag">${this.escapeHtml(ui.issueWcagPrefix)} ${wcagChips}</div>
      <div class="issue-actions">
        <button class="btn-copy-selector" data-selector="${this.escapeHtml(selector)}">${this.escapeHtml(ui.copySelector)}</button>
      </div>
      <div class="issue-details">
        <div class="help-text">${this.escapeHtml(issue.help)}</div>
        ${
          issue.fixSuggestions.length
            ? `<ul class="fix-suggestions">${issue.fixSuggestions.map((s) => `<li>${this.escapeHtml(s)}</li>`).join('')}</ul>`
            : ''
        }
      </div>
    `;

    item.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('btn-copy-selector')) return;
      item.classList.toggle('expanded');
      void this.navigateToElement(selector);
    });

    const copyBtn = item.querySelector('.btn-copy-selector') as HTMLButtonElement;
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      void navigator.clipboard.writeText(selector).then(() => {
        copyBtn.textContent = ui.copiedSelector;
        setTimeout(() => { copyBtn.textContent = ui.copySelector; }, 1500);
      });
    });

    return item;
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
