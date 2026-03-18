import { Message, ScanResult, Settings, StorageData } from '../types';
import { Logger } from '../utils/logger';

/**
 * Background script entry point.
 * Manages extension lifecycle, context menus, storage, and communication.
 */
class BackgroundScript {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('BackgroundScript');
    this.initialize();
  }

  /**
   * Initializes background script
   */
  private initialize(): void {
    this.logger.info('Background script initialized');
    this.setupContextMenu();
    this.setupMessageListener();
    this.migrateStorageIfNeeded();
  }

  /**
   * Sets up context menu items
   */
  private setupContextMenu(): void {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'a11y-check-page',
        title: 'Проверить доступность страницы',
        contexts: ['page', 'frame']
      });

      chrome.contextMenus.create({
        id: 'a11y-open-devtools',
        title: 'Открыть панель A11y Checker',
        contexts: ['page', 'frame']
      });

      this.logger.info('Context menu created');
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'a11y-check-page') {
        if (!tab || typeof tab.id !== 'number' || tab.id < 0) {
          this.logger.error('Cannot trigger scan: invalid tab id', tab);
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

      if (info.menuItemId === 'a11y-open-devtools') {
        if (!tab || typeof tab.id !== 'number' || tab.id < 0) {
          this.logger.error('Cannot open devtools: invalid tab id', tab);
          return;
        }

        chrome.devtools && this.logger.info('DevTools panel will be opened from DevTools UI');
        // Открытие панели делается самим DevTools через devtools_page
      }
    });
  }

  /**
   * Sets up message listener for communication with content scripts and popup
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (request: Message, sender, sendResponse) => {
        this.logger.info('Received message in background:', request.action);

        switch (request.action) {
          case 'saveScanResult':
            this.handleSaveScanResult(request.payload as ScanResult)
              .then(() => sendResponse({ success: true }))
              .catch(error => {
                this.logger.error('Failed to save scan result:', error);
                sendResponse({ success: false, error: String(error) });
              });
            return true;

          case 'getLastScan':
            this.handleGetLastScan()
              .then(result => sendResponse({ success: true, result }))
              .catch(error => {
                this.logger.error('Failed to get last scan:', error);
                sendResponse({ success: false, error: String(error) });
              });
            return true;

          case 'getSettings':
            this.handleGetSettings()
              .then(settings => sendResponse({ success: true, settings }))
              .catch(error => {
                this.logger.error('Failed to get settings:', error);
                sendResponse({ success: false, error: String(error) });
              });
            return true;

          case 'updateSettings':
            this.handleUpdateSettings(request.payload as Partial<Settings>)
              .then(() => sendResponse({ success: true }))
              .catch(error => {
                this.logger.error('Failed to update settings:', error);
                sendResponse({ success: false, error: String(error) });
              });
            return true;

          default:
            this.logger.warn('Unknown action in background:', request.action);
            sendResponse({ success: false, error: 'Unknown action' });
            return true;
        }
      }
    );
  }

  /**
   * Handles saving scan result to storage
   */
  private async handleSaveScanResult(result: ScanResult): Promise<void> {
    const data = await this.getStorageData();

    data.scanResults = [result, ...data.scanResults].slice(0, 50);

    await chrome.storage.local.set({ a11yCheckerData: data });
    this.logger.info('Scan result saved', { id: result.id, url: result.url });
  }

  /**
   * Retrieves last scan result from storage
   */
  private async handleGetLastScan(): Promise<ScanResult | null> {
    const data = await this.getStorageData();
    return data.scanResults[0] ?? null;
  }

  /**
   * Retrieves settings from storage
   */
  private async handleGetSettings(): Promise<Settings> {
    const data = await this.getStorageData();
    return data.settings;
  }

  /**
   * Updates settings in storage
   */
  private async handleUpdateSettings(partialSettings: Partial<Settings>): Promise<void> {
    const data = await this.getStorageData();
    data.settings = { ...data.settings, ...partialSettings };

    await chrome.storage.local.set({ a11yCheckerData: data });
    this.logger.info('Settings updated', data.settings);
  }

  /**
   * Migrates storage structure if needed
   */
  private async migrateStorageIfNeeded(): Promise<void> {
    const data = await this.getStorageData();
    // В будущем можно добавить миграции по версиям схемы
    await chrome.storage.local.set({ a11yCheckerData: data });
  }

  /**
   * Gets storage data with defaults
   */
  private async getStorageData(): Promise<StorageData> {
    const stored = await chrome.storage.local.get('a11yCheckerData');
    const data = stored.a11yCheckerData as StorageData | undefined;

    if (data) {
      return data;
    }

    const defaultData: StorageData = {
      scanResults: [],
      settings: {
        wcagLevel: 'AA',
        includeColorContrast: true,
        includeImages: true,
        includeKeyboard: true,
        includeSemantics: true,
        autoScanOnLoad: false,
        theme: 'light',
      },
      currentTabId: null,
    };

    return defaultData;
  }
}

new BackgroundScript();
