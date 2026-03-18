import { Settings, AccessibilityIssue } from '../types';
/**
 * Validator class for checking accessibility standards compliance
 */
export declare class Validator {
    private logger;
    constructor();
    /**
     * Validates if the issues meet the specified WCAG level requirements
     * @param issues List of accessibility issues found
     * @param wcagLevel The WCAG level to validate against (A, AA, or AAA)
     * @returns Boolean indicating if the page passes validation
     */
    validateWcagCompliance(issues: AccessibilityIssue[], wcagLevel: 'A' | 'AA' | 'AAA'): boolean;
    /**
     * Validates settings configuration
     * @param settings The settings to validate
     * @returns Boolean indicating if settings are valid
     */
    validateSettings(settings: Settings): boolean;
    /**
     * Validates scan results
     * @param scanResults The scan results to validate
     * @returns Boolean indicating if scan results are valid
     */
    validateScanResults(scanResults: any): boolean;
}
//# sourceMappingURL=validator.d.ts.map