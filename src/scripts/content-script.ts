import { Scanner } from '../core/scanner';
import { Settings, ScanResult } from '../types';
import { Logger } from '../utils/logger';
import { createDefaultSettings } from '../utils/settings-defaults';

class ContentScript {
  private scanner: Scanner;
  private logger: Logger;
  private settings: Settings;

  constructor() {
    this.logger = new Logger('ContentScript');
    this.settings = this.getDefaultSettings();
    this.scanner = new Scanner(this.settings);
    this.setupMessageListener();
    this.logger.info('Content script initialized');
  }

  private getDefaultSettings(): Settings {
    return createDefaultSettings();
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
