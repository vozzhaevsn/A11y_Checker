import { Scanner } from '../core/scanner';
import { Settings, ScanResult } from '../types';
import { Logger } from '../utils/logger';

class ContentScript {
  private scanner: Scanner;
  private logger: Logger;
  private settings: Settings;

  constructor() {
    this.logger = new Logger('ContentScript');
    this.settings = this.getDefaultSettings();
    this.scanner = new Scanner(this.settings);
    this.setupMessageListener();
    this.injectAxeCore();
    this.logger.info('Content script initialized');
  }

  private getDefaultSettings(): Settings {
    return {
      wcagLevel: 'AA',
      includeColorContrast: true,
      includeImages: true,
      includeKeyboard: true,
      includeSemantics: true,
      autoScanOnLoad: false,
      theme: 'light'
    };
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      this.logger.info('Received message:', request.action);

      switch (request.action) {
        case 'scan':
          this.performScan()
            .then(result => {
              sendResponse({ success: true, result });
            })
            .catch(error => {
              this.logger.error('Scan failed:', error);
              sendResponse({ success: false, error: error.message });
            });
          return true;
        
        case 'getSettings':
          sendResponse({ success: true, settings: this.settings });
          return true;
        
        case 'updateSettings':
          this.settings = { ...this.settings, ...request.settings };
          this.scanner = new Scanner(this.settings);
          sendResponse({ success: true });
          return true;
          
        default:
          this.logger.warn('Unknown action:', request.action);
          sendResponse({ success: false, error: 'Unknown action' });
          return true;
      }
    });
  }

  private injectAxeCore(): void {
    if (typeof (window as any).axe !== 'undefined') {
      this.logger.info('Axe-core already present');
      return;
    }

    import('axe-core').then(axeModule => {
      (window as any).axe = axeModule.default;
      this.logger.info('Axe-core injected successfully');
    }).catch(error => {
      this.logger.error('Failed to inject axe-core:', error);
    });
  }

  private async performScan(): Promise<ScanResult> {
    this.logger.info('Starting accessibility scan...');
    
    const url = window.location.href;
    const result = await this.scanner.scanPage(url);
    
    this.logger.info(`Scan completed. Found ${result.summary.total} issues`);
    
    return result;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript();
  });
} else {
  new ContentScript();
}