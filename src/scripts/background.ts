import { ScanResult, Settings } from '../types';
import { Logger } from '../utils/logger';
import { createDefaultSettings, normalizeSettings } from '../utils/settings-defaults';
import { contextMenuTitle } from '../i18n';

interface StorageData {
  scanResults: ScanResult[];
  settings: Settings;
  currentTabId: number | null;
}

interface RequestMessage {
  action: string;
  payload?: ScanResult | Partial<Settings>;
  tabId?: number;
}

class BackgroundScript {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('BackgroundScript');
    this.initialize();
  }

  private initialize(): void {
    this.logger.info('Background script initialized');
    this.setupContextMenu();
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'a11y-check-page') {
        if (!tab || typeof tab.id !== 'number' || tab.id < 0) {
          this.logger.error('Cannot trigger scan: invalid tab id');
          return;
        }

        chrome.tabs
          .sendMessage(tab.id, { action: 'scan' })
          .then((response) => {
            this.logger.info('Scan triggered from context menu', response);
          })
          .catch((error) => {
            this.logger.error('Failed to trigger scan from context menu', error);
          });
      }
    });
    this.setupMessageListener();
  }

  private setupContextMenu(): void {
    void this.getStorageData().then((data) => {
      const title = contextMenuTitle(data.settings.locale);
      chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
          id: 'a11y-check-page',
          title,
          contexts: ['page', 'frame'],
        });
      });
    });
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (request: RequestMessage, sender, sendResponse) => {
        this.logger.info('Received message:', request.action);

        switch (request.action) {
          case 'saveScanResult':
            this.handleSaveScanResult(request.payload as ScanResult)
              .then(() => sendResponse({ success: true }))
              .catch((error) => {
                this.logger.error('Failed to save scan result:', error);
                sendResponse({ success: false, error: String(error) });
              });
            return true;

          case 'getLastScan':
            this.handleGetLastScan()
              .then((result) => sendResponse({ success: true, result }))
              .catch((error) => {
                this.logger.error('Failed to get last scan:', error);
                sendResponse({ success: false, error: String(error) });
              });
            return true;

          case 'getSettings':
            this.handleGetSettings()
              .then((settings) => sendResponse({ success: true, settings }))
              .catch((error) => {
                this.logger.error('Failed to get settings:', error);
                sendResponse({ success: false, error: String(error) });
              });
            return true;

          case 'updateSettings':
            this.handleUpdateSettings(request.payload as Partial<Settings>)
              .then(() => sendResponse({ success: true }))
              .catch((error) => {
                this.logger.error('Failed to update settings:', error);
                sendResponse({ success: false, error: String(error) });
              });
            return true;

          case 'clearResults':
            this.handleClearResults()
              .then(() => sendResponse({ success: true }))
              .catch((error) => {
                this.logger.error('Failed to clear results:', error);
                sendResponse({ success: false, error: String(error) });
              });
            return true;

          case 'devtoolsScan': {
            const tabId = request.tabId ?? sender.tab?.id;
            if (typeof tabId !== 'number' || tabId < 0) {
              sendResponse({ success: false, error: 'No valid tab id' });
              return true;
            }
            chrome.tabs
              .sendMessage(tabId, { action: 'scan' })
              .then((res) => sendResponse(res))
              .catch((err) => {
                sendResponse({ success: false, error: String(err) });
              });
            return true;
          }

          default:
            this.logger.warn('Unknown action:', request.action);
            sendResponse({ success: false, error: 'Unknown action' });
            return true;
        }
      },
    );
  }

  private async handleSaveScanResult(result: ScanResult): Promise<void> {
    const data = await this.getStorageData();
    data.scanResults = [result, ...data.scanResults].slice(0, 50);
    await chrome.storage.local.set({ a11yCheckerData: data });
    this.logger.info('Scan result saved', { id: result.id, url: result.url });
  }

  private async handleGetLastScan(): Promise<ScanResult | null> {
    const data = await this.getStorageData();
    return data.scanResults[0] ?? null;
  }

  private async handleGetSettings(): Promise<Settings> {
    const data = await this.getStorageData();
    return data.settings;
  }

  private async handleUpdateSettings(partial: Partial<Settings>): Promise<void> {
    const data = await this.getStorageData();
    data.settings = { ...data.settings, ...partial };
    await chrome.storage.local.set({ a11yCheckerData: data });
    this.setupContextMenu();
    this.logger.info('Settings updated');
  }

  private async handleClearResults(): Promise<void> {
    const data = await this.getStorageData();
    data.scanResults = [];
    await chrome.storage.local.set({ a11yCheckerData: data });
    this.logger.info('Results cleared');
  }

  private async getStorageData(): Promise<StorageData> {
    const stored = await chrome.storage.local.get('a11yCheckerData');
    const data = stored['a11yCheckerData'] as StorageData | undefined;

    if (data) {
      data.settings = normalizeSettings(data.settings);
      return data;
    }

    return {
      scanResults: [],
      settings: createDefaultSettings(),
      currentTabId: null,
    };
  }
}

new BackgroundScript();
