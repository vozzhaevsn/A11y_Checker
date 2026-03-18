import { ImageAltResult, AccessibilityIssue, ElementInfo } from '../types';
import { Logger } from '../utils/logger';

/**
 * Image accessibility checker implementation
 * Evaluates image alternative text according to WCAG guidelines
 */
export class ImageChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ImageChecker');
  }

  /**
   * Checks accessibility of all images on the page
   * @returns Promise resolving to array of image-related accessibility issues
   */
  async check(): Promise<AccessibilityIssue[]> {
    try {
      this.logger.info('Starting image accessibility check');
      
      const issues: AccessibilityIssue[] = [];
      const images = this.getImages();
      
      for (const image of images) {
        const result = this.checkImageAlt(image);
        
        if (!result.isValid) {
          const issue: AccessibilityIssue = {
            id: `image-alt-${image.id || image.tagName}-${Date.now()}`,
            element: image,
            description: result.isDecorative 
              ? `Decorative image missing appropriate decorative attribute (role="presentation" or aria-hidden="true")` 
              : `Image missing alternative text (alt attribute)`,
            help: result.isDecorative 
              ? `Decorative image should have role="presentation" or aria-hidden="true"` 
              : `Image element is missing alt attribute or has empty alt value`,
            helpUrl: result.isDecorative 
              ? 'https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA4.html' 
              : 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
            impact: result.hasAlt ? 'moderate' : 'critical',
            tags: ['cat.text-alternatives', 'wcag2a', 'wcag111'],
            wcagLevels: ['A'],
            wcagCriteria: ['1.1.1'],
            fixSuggestions: result.isDecorative 
              ? [
                  `Add role="presentation" to decorative image: <img src="..." role="presentation">`,
                  `Or add aria-hidden="true" if image is purely decorative: <img src="..." aria-hidden="true">`
                ]
              : [
                  `Add descriptive alt text: <img src="..." alt="descriptive text">`,
                  `For decorative images, use empty alt: <img src="..." alt="">`
                ]
          };
          
          issues.push(issue);
        }
      }
      
      this.logger.info(`Image accessibility check completed. Found ${issues.length} issues.`);
      return issues;
    } catch (error) {
      this.logger.error('Error during image accessibility check:', error);
      throw error;
    }
  }

  /**
   * Gets all image elements on the page
   */
  private getImages(): ElementInfo[] {
    const elements: ElementInfo[] = [];
    
    const imageElements = document.querySelectorAll('img, [role="img"]');
    
    imageElements.forEach((el: Element) => {
      const computedStyle = window.getComputedStyle(el);
      
      if (computedStyle.display === 'none' || 
          computedStyle.visibility === 'hidden' || 
          computedStyle.opacity === '0') {
        return;
      }
      
      const rect = el.getBoundingClientRect();
      
      elements.push({
        tagName: el.tagName.toLowerCase(),
        id: el.id || undefined,
        className: el.className || undefined,
        attributes: this.getElementAttributes(el),
        textContent: el.textContent || undefined,
        position: {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left
        }
      });
    });
    
    return elements;
  }

  /**
   * Checks alternative text for a single image
   */
  private checkImageAlt(image: ElementInfo): ImageAltResult {
    let domElement: Element | null = null;
    
    if (image.id) {
      domElement = document.getElementById(image.id);
    } else {
      domElement = document.querySelector(
        `${image.tagName}${image.className ? '.' + image.className.replace(/\s+/g, '.') : ''}[src]`
      );
    }
    
    if (!domElement) {
      return {
        element: image,
        hasAlt: false,
        altValue: '',
        isDecorative: false,
        isValid: false
      };
    }
    
    const altValue = domElement.getAttribute('alt') || '';
    const role = domElement.getAttribute('role');
    const ariaHidden = domElement.getAttribute('aria-hidden');
    
    const isDecorative = altValue === '' || role === 'presentation' || ariaHidden === 'true';
    
    const hasAlt = altValue !== undefined && altValue !== null;
    const isValid = (hasAlt && altValue.trim() !== '') || 
                   (isDecorative && (role === 'presentation' || ariaHidden === 'true' || altValue === ''));
    
    return {
      element: image,
      hasAlt,
      altValue,
      isDecorative,
      isValid
    };
  }

  /**
   * Gets element attributes as key-value pairs
   */
  private getElementAttributes(element: Element): { [key: string]: string } {
    const attrs: { [key: string]: string } = {};
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes.item(i);
      if (!attr) continue;
      attrs[attr.name] = attr.value;
    }
    
    return attrs;
  }
}
