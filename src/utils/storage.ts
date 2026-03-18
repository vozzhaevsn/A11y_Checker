import { ScanResult, Settings, StorageData } from '../types';
import { Logger } from './logger';

/**
 * Storage utility for managing extension data
 */
export class StorageUtil {
  private logger: Logger;
  private readonly STORAGE_KEY_RESULTS = 'a11y_scan_results';
  private readonly STORAGE_KEY_SETTINGS = 'a11y_settings';

  constructor() {
    this.logger = new Logger('StorageUtil');
  }

  /**
   * Saves a scan result to storage
   */
  async saveScanResult(result: ScanResult): Promise<void> {
    try {
      const existingResults = await this.getAllScanResults();
      existingResults.push(result);
      
      // Keep only last 50 results
      const limitedResults = existingResults.slice(-50);
      
      await chrome.storage.local.set({
        [this.STORAGE_KEY_RESULTS]: limitedResults
      });
      
      this.logger.info(`Saved scan result for ${result.url}`);
    } catch (error) {
      this.logger.error('Failed to save scan result:', error);
      throw error;
    }
  }

  /**
   * Retrieves all scan results from storage
   */
  async getAllScanResults(): Promise<ScanResult[]> {
    try {
      const data = await chrome.storage.local.get(this.STORAGE_KEY_RESULTS);
      return data[this.STORAGE_KEY_RESULTS] || [];
    } catch (error) {
      this.logger.error('Failed to retrieve scan results:', error);
      return [];
    }
  }

  /**
   * Retrieves scan result by ID
   */
  async getScanResultById(id: string): Promise<ScanResult | null> {
    try {
      const results = await this.getAllScanResults();
      return results.find(r => r.id === id) || null;
    } catch (error) {
      this.logger.error('Failed to retrieve scan result by ID:', error);
      return null;
    }
  }

  /**
   * Deletes a scan result by ID
   */
  async deleteScanResult(id: string): Promise<void> {
    try {
      const results = await this.getAllScanResults();
      const filtered = results.filter(r => r.id !== id);
      
      await chrome.storage.local.set({
        [this.STORAGE_KEY_RESULTS]: filtered
      });
      
      this.logger.info(`Deleted scan result ${id}`);
    } catch (error) {
      this.logger.error('Failed to delete scan result:', error);
      throw error;
    }
  }

  /**
   * Clears all scan results
   */
  async clearAllScanResults(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEY_RESULTS]: []
      });
      
      this.logger.info('Cleared all scan results');
    } catch (error) {
      this.logger.error('Failed to clear scan results:', error);
      throw error;
    }
  }

  /**
   * Saves settings to storage
   */
  async saveSettings(settings: Settings): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEY_SETTINGS]: settings
      });
      
      this.logger.info('Saved settings');
    } catch (error) {
      this.logger.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Retrieves settings from storage
   */
  async getSettings(): Promise<Settings> {
    try {
      const data = await chrome.storage.local.get(this.STORAGE_KEY_SETTINGS);
      
      // Return saved settings or default settings
      return data[this.STORAGE_KEY_SETTINGS] || this.getDefaultSettings();
    } catch (error) {
      this.logger.error('Failed to retrieve settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Returns default settings
   */
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
}