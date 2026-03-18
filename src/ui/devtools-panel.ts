import { ScanResult } from '../types';
import { ExportUtil } from '../utils/export';

class DevToolsPanelUI {
  private resultsContainer: HTMLElement;
  private scanBtn: HTMLButtonElement;
  private exportBtn: HTMLButtonElement;
  private clearBtn: HTMLButtonElement;
  private statusBar: HTMLElement;
  private scanResult: ScanResult | null = null;
  private exporter = new ExportUtil();

  constructor() {
    this.resultsContainer = document.getElementById('results-container') as HTMLElement;
    this.scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
    this.exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
    this.clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
    this.statusBar = document.getElementById('status-bar') as HTMLElement;

    this.initializeEventListeners();
    this.updateStatusBar('Ready to scan');
  }

  private initializeEventListeners(): void {
    this.scanBtn.addEventListener('click', () => void this.runScan());
    this.exportBtn.addEventListener('click', () => this.exportResults());
    this.clearBtn.addEventListener('click', () => this.clearResults());
  }

  private async runScan(): Promise<void> {
    this.updateStatusBar('Running scan...');

    const tabId = chrome.devtools.inspectedWindow.tabId;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'devtoolsScan',
        tabId,
      });

      if (!response?.success) {
        this.updateStatusBar(`Scan failed: ${response?.error ?? 'unknown error'}`);
        return;
      }

      this.scanResult = response.result as ScanResult;
      this.renderResults(this.scanResult);
      this.updateStatusBar(
        `Scan completed: ${this.scanResult.summary.total} issues (critical: ${this.scanResult.summary.critical})`
      );
    } catch (error) {
      console.error(error);
      this.updateStatusBar(`Scan failed: ${(error as Error).message}`);
    }
  }

  private renderResults(result: ScanResult): void {
    this.resultsContainer.innerHTML = '';

    if (result.issues.length === 0) {
      this.resultsContainer.innerHTML = '<p>No issues found on this page.</p>';
      return;
    }

    result.issues.forEach((issue) => {
      const item = document.createElement('div');
      item.className = `result-item ${issue.impact}`;

      item.innerHTML = `
        <div class="result-header">
          <span class="${issue.impact}">${issue.impact.toUpperCase()}</span>
          <span class="element-tag">${issue.element.tagName}${
            issue.element.id ? `#${issue.element.id}` : ''
          }</span>
        </div>
        <div class="description">${issue.description}</div>
        <div class="wcag">WCAG: ${issue.wcagCriteria.join(', ')}</div>
      `;

      this.resultsContainer.appendChild(item);
    });
  }

  private exportResults(): void {
    if (!this.scanResult) {
      this.updateStatusBar('Nothing to export. Run a scan first.');
      return;
    }

    const json = this.exporter.exportAsJson(this.scanResult);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `a11y-results-${new Date(this.scanResult.timestamp).toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
    this.updateStatusBar('Results exported as JSON');
  }

  private clearResults(): void {
    this.scanResult = null;
    this.resultsContainer.innerHTML =
      '<p>No scan results yet. Click "Run Accessibility Scan".</p>';
    this.updateStatusBar('Results cleared');
  }

  private updateStatusBar(message: string): void {
    this.statusBar.textContent = message;
  }
}

new DevToolsPanelUI();