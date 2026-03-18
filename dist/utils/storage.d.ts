import { ScanResult, Settings } from '../types';
/**
 * Storage utility for managing extension data
 */
export declare class StorageUtil {
    private logger;
    private readonly STORAGE_KEY_RESULTS;
    private readonly STORAGE_KEY_SETTINGS;
    constructor();
    /**
     * Saves a scan result to storage
     */
    saveScanResult(result: ScanResult): Promise<void>;
    /**
     * Retrieves all scan results from storage
     */
    getAllScanResults(): Promise<ScanResult[]>;
    /**
     * Retrieves scan result by ID
     */
    getScanResultById(id: string): Promise<ScanResult | null>;
    /**
     * Deletes a scan result by ID
     */
    deleteScanResult(id: string): Promise<void>;
    /**
     * Clears all scan results
     */
    clearAllScanResults(): Promise<void>;
    /**
     * Saves settings to storage
     */
    saveSettings(settings: Settings): Promise<void>;
    /**
     * Retrieves settings from storage
     */
    getSettings(): Promise<Settings>;
    /**
     * Returns default settings
     */
    private getDefaultSettings;
}
//# sourceMappingURL=storage.d.ts.map