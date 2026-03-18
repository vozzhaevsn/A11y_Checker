import { AccessibilityIssue } from '../types';
/**
 * Color contrast checker implementation
 * Evaluates color contrast ratios according to WCAG guidelines
 */
export declare class ContrastChecker {
    private logger;
    constructor();
    /**
     * Checks color contrast ratios for all text elements on the page
     * @returns Promise resolving to array of contrast-related accessibility issues
     */
    check(): Promise<AccessibilityIssue[]>;
    /**
     * Gets all text elements that need contrast checking
     */
    private getTextElements;
    /**
     * Checks contrast for a single element
     */
    private checkElementContrast;
    /**
     * Gets the background color of an element, considering ancestors
     */
    private getBackgroundColor;
    /**
     * Parses a CSS color value into RGBA components
     */
    private parseColor;
    /**
     * Converts HSL color to RGB
     */
    private hslToRgb;
    /**
     * Calculates contrast ratio between two colors
     */
    private calculateContrastRatio;
    /**
     * Calculates relative luminance of a color
     */
    private relativeLuminance;
    /**
     * Determines the required WCAG level based on contrast ratio
     */
    private getRequiredLevel;
    /**
     * Determines impact level based on contrast ratio
     */
    private determineImpactLevel;
    /**
     * Gets element attributes as key-value pairs
     */
    private getElementAttributes;
}
//# sourceMappingURL=contrast.d.ts.map