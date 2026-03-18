import { AccessibilityIssue } from '../types';
/**
 * Image accessibility checker implementation
 * Evaluates image alternative text according to WCAG guidelines
 */
export declare class ImageChecker {
    private logger;
    constructor();
    /**
     * Checks accessibility of all images on the page
     * @returns Promise resolving to array of image-related accessibility issues
     */
    check(): Promise<AccessibilityIssue[]>;
    /**
     * Gets all image elements on the page
     */
    private getImages;
    /**
     * Checks alternative text for a single image
     */
    private checkImageAlt;
    /**
     * Gets element attributes as key-value pairs
     */
    private getElementAttributes;
}
//# sourceMappingURL=images.d.ts.map