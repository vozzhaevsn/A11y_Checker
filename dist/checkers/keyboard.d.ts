import { AccessibilityIssue } from '../types';
/**
 * Keyboard accessibility checker implementation
 * Evaluates keyboard navigation and focus management
 */
export declare class KeyboardChecker {
    private logger;
    constructor();
    /**
     * Checks keyboard accessibility for interactive elements
     * @returns Promise resolving to array of keyboard-related accessibility issues
     */
    check(): Promise<AccessibilityIssue[]>;
    /**
     * Gets all interactive elements
     */
    private getInteractiveElements;
    /**
     * Checks keyboard accessibility for a single element
     */
    private checkKeyboardAccess;
    /**
     * Checks if element is keyboard accessible
     */
    private isKeyboardAccessible;
    /**
     * Checks if tabindex value is valid
     */
    private isTabIndexValid;
    /**
     * Checks if element has visible focus indicator
     */
    private hasFocusIndicator;
    /**
     * Gets description for keyboard issue
     */
    private getKeyboardIssueDescription;
    /**
     * Gets help text for keyboard issue
     */
    private getKeyboardIssueHelp;
    /**
     * Gets fix suggestions for keyboard issue
     */
    private getKeyboardFixSuggestions;
}
//# sourceMappingURL=keyboard.d.ts.map