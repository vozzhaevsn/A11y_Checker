import { AccessibilityIssue } from '../types';
/**
 * Semantic structure checker implementation
 * Evaluates proper use of HTML semantics according to WCAG guidelines
 */
export declare class SemanticChecker {
    private logger;
    constructor();
    /**
     * Checks semantic structure of the page
     * @returns Promise resolving to array of semantic-related accessibility issues
     */
    check(): Promise<AccessibilityIssue[]>;
    /**
     * Checks heading hierarchy for proper structure
     */
    private checkHeadings;
    /**
     * Checks for proper landmark regions
     */
    private checkLandmarks;
    /**
     * Checks form semantics for proper labeling and structure
     */
    private checkFormSemantics;
    /**
     * Checks if an input has an associated label
     */
    private inputHasLabel;
    /**
     * Gets semantic tag for a landmark role
     */
    private getSemanticTag;
    /**
     * Gets element information
     */
    private getElementInfo;
}
//# sourceMappingURL=semantic.d.ts.map