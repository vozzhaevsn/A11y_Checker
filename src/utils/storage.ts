import { ScanResult, Settings } from '../types';
import { Logger } from './logger';

export class StorageUtil {
  private logger: Logger;
  private readonly STORAGE_KEY_RESULTS = 'a11y_scan_results';
  private readonly STORAGE_KEY_SETTINGS = 'a11y_settings';

  constructor() {
    this.logger = new Logger('StorageUtil');
  }

  async saveScanResult(result: ScanResult): Promise<void> {
    try {
      const existing = await this.getAllScanResults();
      existing.push(result);
      const limited = existing.slice(-50);

      await chrome.storage.local.set({ [this.STORAGE_KEY_RESULTS]: limited });
      this.logger.info(`Saved scan result for ${result.url}`);
    } catch (error) {
      this.logger.error('Failed to save scan result:', error);
      throw error;
    }
  }

  async getAllScanResults(): Promise<ScanResult[]> {
    try {
      const data = await chrome.storage.local.get(this.STORAGE_KEY_RESULTS);
      return (data[this.STORAGE_KEY_RESULTS] as ScanResult[] | undefined) ?? [];
    } catch (error) {
      this.logger.error('Failed to retrieve scan results:', error);
      return [];
    }
  }

  async getScanResultById(id: string): Promise<ScanResult | null> {
    const results = await this.getAllScanResults();
    return results.find((r) => r.id === id) ?? null;
  }

  async deleteScanResult(id: string): Promise<void> {
    const results = await this.getAllScanResults();
    const filtered = results.filter((r) => r.id !== id);
    await chrome.storage.local.set({ [this.STORAGE_KEY_RESULTS]: filtered });
  }

  async clearAllScanResults(): Promise<void> {
    await chrome.storage.local.set({ [this.STORAGE_KEY_RESULTS]: [] });
    this.logger.info('Cleared all scan results');
  }

  async saveSettings(settings: Settings): Promise<void> {
    await chrome.storage.local.set({ [this.STORAGE_KEY_SETTINGS]: settings });
    this.logger.info('Saved settings');
  }

  async getSettings(): Promise<Settings> {
    try {
      const data = await chrome.storage.local.get(this.STORAGE_KEY_SETTINGS);
      return (data[this.STORAGE_KEY_SETTINGS] as Settings | undefined) ?? this.getDefaultSettings();
    } catch {
      return this.getDefaultSettings();
    }
  }

  private getDefaultSettings(): Settings {
    return {
      wcagLevel: 'AA',
      includeColorContrast: true,
      includeImages: true,
      includeKeyboard: true,
      includeSemantics: true,
      autoScanOnLoad: false,
      theme: 'light',
    };
  }
}
