import { ScanResult, Settings } from '../types';
/**
 * Main accessibility scanner class
 * Orchestrates scanning process using multiple checkers
 */
export declare class Scanner {
    private settings;
    private axeEngine;
    private contrastChecker;
    private imageChecker;
    private semanticChecker;
    private keyboardChecker;
    private logger;
    constructor(settings: Settings);
    /**
     * Performs comprehensive accessibility scan of the current page
     * @param url The URL of the page being scanned
     * @returns Promise resolving to ScanResult
     */
    scanPage(url: string): Promise<ScanResult>;
    /**
     * Maps axe-core results to our internal AccessibilityIssue format
     */
    private mapAxeResults;
    /**
     * Maps axe-core node to our ElementInfo format
     */
    private mapElement;
    /**
     * Gets tag name from target selector
     */
    private getTagName;
    /**
     * Gets element ID from target selector
     */
    private getElementId;
    /**
     * Gets element class from target selector
     */
    private getClassName;
    /**
     * Gets element text content
     */
    private getElementText;
    /**
     * Gets element rectangle (position/size)
     */
    private getElementRect;
    /**
     * Maps axe-core impact level to our internal impact levels
     */
    private mapImpactLevel;
    /**
     * Extracts WCAG levels from tags
     */
    private extractWcagLevels;
    /**
     * Extracts WCAG criteria from tags
     */
    private extractWcagCriteria;
    /**
     * Calculates summary statistics from issues
     */
    private calculateSummary;
    /**
     * Generates unique ID for scan result
     */
    private generateId;
}
//# sourceMappingURL=scanner.d.ts.map