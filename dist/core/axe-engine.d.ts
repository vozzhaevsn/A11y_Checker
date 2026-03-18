import { AxeCoreResult, Settings } from '../types';
/**
 * Wrapper class for axe-core accessibility engine
 */
export declare class AxeEngine {
    private logger;
    constructor();
    /**
     * Runs axe-core accessibility scan on the current page
     * @param settings - User settings for scan configuration
     * @returns Promise resolving to AxeCoreResult
     */
    scan(settings: Settings): Promise<AxeCoreResult>;
    /**
     * Returns the axe-core configuration for the current settings
     */
    private getConfig;
    /**
     * Resets axe-core configuration to defaults
     */
    reset(): void;
}
//# sourceMappingURL=axe-engine.d.ts.map