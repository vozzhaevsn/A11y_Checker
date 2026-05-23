import { Scanner } from '../core/scanner';
import { Settings, ScanResult } from '../types';
import { Logger } from '../utils/logger';
import { createDefaultSettings } from '../utils/settings-defaults';

class ContentScript {
  private scanner: Scanner;
  private logger: Logger;
  private settings: Settings;
  private domObserver: MutationObserver | null = null;
  private domDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private autoScanCount: number = 0;
  private static readonly MAX_AUTO_SCANS = 5;
  private static readonly DOM_DEBOUNCE_MS = 2000;

  constructor() {
    this.logger = new Logger('ContentScript');
    this.settings = this.getDefaultSettings();
    this.scanner = new Scanner(this.settings);
    this.setupMessageListener();
    this.logger.info('Content script initialized');
    void this.autoScanIfEnabled();
  }

  private getDefaultSettings(): Settings {
    return createDefaultSettings();
  }

  private async autoScanIfEnabled(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response?.success && response.settings) {
        this.settings = response.settings as Settings;
        this.scanner = new Scanner(this.settings);
      }
    } catch {
      /* use defaults */
    }

    if (this.settings.watchDomChanges) {
      this.setupDomWatcher();
    }

    if (!this.settings.autoScanOnLoad) return;

    if (document.readyState === 'complete') {
      await this.performScan();
    } else {
      window.addEventListener('load', () => void this.performScan(), { once: true });
    }
  }

  private scheduleAutoScan(): void {
    if (this.domDebounceTimer) clearTimeout(this.domDebounceTimer);
    this.domDebounceTimer = setTimeout(() => {
      this.domDebounceTimer = null;
      if (this.autoScanCount >= ContentScript.MAX_AUTO_SCANS) {
        this.logger.info('Max auto-scans reached, stopping DOM watcher');
        this.teardownDomWatcher();
        return;
      }
      this.autoScanCount++;
      this.logger.info(`DOM change detected, auto-scanning (${this.autoScanCount}/${ContentScript.MAX_AUTO_SCANS})`);
      void this.performScan();
    }, ContentScript.DOM_DEBOUNCE_MS);
  }

  private setupDomWatcher(): void {
    if (this.domObserver) return;
    this.domObserver = new MutationObserver(() => {
      this.scheduleAutoScan();
    });
    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    this.logger.info('DOM watcher started');
  }

  private teardownDomWatcher(): void {
    if (this.domDebounceTimer) {
      clearTimeout(this.domDebounceTimer);
      this.domDebounceTimer = null;
    }
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
      this.logger.info('DOM watcher stopped');
    }
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (request: { action: string; settings?: Partial<Settings> }, _sender, sendResponse) => {
        this.logger.info('Received message:', request.action);

        switch (request.action) {
          case 'scan':
            this.performScan()
              .then((result) => {
                sendResponse({ success: true, result });
              })
              .catch((error: Error) => {
                this.logger.error('Scan failed:', error);
                sendResponse({ success: false, error: error.message });
              });
            return true;

          case 'getSettings':
            sendResponse({ success: true, settings: this.settings });
            return true;

          case 'updateSettings':
            if (request.settings) {
              this.settings = { ...this.settings, ...request.settings };
              this.scanner = new Scanner(this.settings);
              if (this.settings.watchDomChanges) {
                this.setupDomWatcher();
              } else {
                this.teardownDomWatcher();
              }
            }
            sendResponse({ success: true });
            return true;

          case 'highlightElement': {
            const payload = (request as { action: string; selector?: string }).selector;
            if (payload) {
              this.highlightElement(payload);
            }
            sendResponse({ success: true });
            return true;
          }

          case 'removeHighlights':
            this.removeHighlights();
            sendResponse({ success: true });
            return true;

          default:
            this.logger.warn('Unknown action:', request.action);
            sendResponse({ success: false, error: 'Unknown action' });
            return true;
        }
      },
    );
  }

  private async performScan(): Promise<ScanResult> {
    this.logger.info('Starting accessibility scan...');

    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response?.success && response.settings) {
        this.settings = response.settings as Settings;
        this.scanner = new Scanner(this.settings);
      }
    } catch {
      this.logger.warn('Failed to load settings from background, using local defaults');
    }

    const url = window.location.href;
    const result = await this.scanner.scanPage(url);

    try {
      await chrome.runtime.sendMessage({ action: 'saveScanResult', payload: result });
    } catch {
      this.logger.error('Failed to persist scan result in background');
    }

    this.logger.info(`Scan completed. Found ${result.summary.total} issues`);

    /* Restart DOM watcher with fresh counter after a full scan completes */
    this.autoScanCount = 0;
    if (this.settings.watchDomChanges) {
      this.setupDomWatcher();
    }

    return result;
  }

  private highlightElement(selector: string): void {
    this.removeHighlights();

    try {
      const el = document.querySelector(selector);
      if (!el) return;

      const overlay = document.createElement('div');
      overlay.className = 'a11y-checker-highlight';
      overlay.setAttribute('data-a11y-highlight', 'true');

      const rect = el.getBoundingClientRect();
      Object.assign(overlay.style, {
        position: 'absolute',
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        outline: '3px solid #e53e3e',
        outlineOffset: '2px',
        backgroundColor: 'rgba(229, 62, 62, 0.1)',
        pointerEvents: 'none',
        zIndex: '2147483647',
        borderRadius: '2px',
        transition: 'opacity 0.3s',
      });

      document.body.appendChild(overlay);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      this.logger.warn('Could not highlight element for selector:', selector);
    }
  }

  private removeHighlights(): void {
    document.querySelectorAll('[data-a11y-highlight]').forEach((el) => el.remove());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript();
  });
} else {
  new ContentScript();
}
