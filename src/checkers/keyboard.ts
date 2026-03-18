import { KeyboardResult, AccessibilityIssue, ElementInfo } from '../types';
import { Logger } from '../utils/logger';

/**
 * Keyboard accessibility checker implementation
 * Evaluates keyboard navigation and focus management
 */
export class KeyboardChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('KeyboardChecker');
  }

  /**
   * Checks keyboard accessibility for interactive elements
   * @returns Promise resolving to array of keyboard-related accessibility issues
   */
  async check(): Promise<AccessibilityIssue[]> {
    try {
      this.logger.info('Starting keyboard accessibility check');
      
      const issues: AccessibilityIssue[] = [];
      const interactiveElements = this.getInteractiveElements();
      
      for (const element of interactiveElements) {
        const result = this.checkKeyboardAccess(element);
        
        if (!result.isValid) {
          const issue: AccessibilityIssue = {
            id: `keyboard-${element.id || element.tagName}-${Date.now()}`,
            element: element,
            description: this.getKeyboardIssueDescription(result),
            help: this.getKeyboardIssueHelp(result),
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
            impact: result.hasFocusIndicator ? 'moderate' : 'serious',
            tags: ['cat.keyboard', 'wcag2a', 'wcag211'],
            wcagLevels: ['A'],
            wcagCriteria: ['2.1.1'],
            fixSuggestions: this.getKeyboardFixSuggestions(result)
          };
          
          issues.push(issue);
        }
      }
      
      this.logger.info(`Keyboard accessibility check completed. Found ${issues.length} issues.`);
      return issues;
    } catch (error) {
      this.logger.error('Error during keyboard accessibility check:', error);
      throw error;
    }
  }

  /**
   * Gets all interactive elements
   */
  private getInteractiveElements(): ElementInfo[] {
    const elements: ElementInfo[] = [];
    
    const interactiveSelectors =
      'a, button, input:not([type="hidden"]), select, textarea, [tabindex], [onclick], [role="button"], [role="link"]';
    const interactiveElements = document.querySelectorAll(interactiveSelectors);
    
    interactiveElements.forEach((el: Element) => {
      const computedStyle = window.getComputedStyle(el);
      
      if (
        computedStyle.display === 'none' ||
        computedStyle.visibility === 'hidden' ||
        computedStyle.opacity === '0'
      ) {
        return;
      }
      
      const rect = el.getBoundingClientRect();
      const attrs: { [key: string]: string } = {};
      
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes.item(i);
        if (!attr) continue;
        attrs[attr.name] = attr.value;
      }
      
      elements.push({
        tagName: el.tagName.toLowerCase(),
        id: el.id || undefined,
        className: (el as HTMLElement).className || undefined,
        attributes: attrs,
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
   * Checks keyboard accessibility for a single element
   */
  private checkKeyboardAccess(element: ElementInfo): KeyboardResult {
    let domElement: Element | null = null;
    
    if (element.id) {
      domElement = document.getElementById(element.id);
    } else {
      domElement = document.querySelector(
        `${element.tagName}${element.className ? '.' + element.className.replace(/\s+/g, '.') : ''}`
      );
    }
    
    if (!domElement) {
      return {
        element: element,
        hasFocusIndicator: false,
        isKeyboardAccessible: false,
        tabIndexValid: false,
        isValid: false
      };
    }
    
    const tabIndex = domElement.getAttribute('tabindex');
    const computedStyle = window.getComputedStyle(domElement);
    
    // Check if element is keyboard accessible
    const isKeyboardAccessible = this.isKeyboardAccessible(domElement);
    
    // Check if element has valid tabindex
    const tabIndexValid = this.isTabIndexValid(tabIndex);
    
    // Check for focus indicator
    const hasFocusIndicator = this.hasFocusIndicator(computedStyle);
    
    const isValid = isKeyboardAccessible && tabIndexValid && hasFocusIndicator;
    
    return {
      element: element,
      hasFocusIndicator,
      isKeyboardAccessible,
      tabIndexValid,
      isValid
    };
  }

  /**
   * Checks if element is keyboard accessible
   */
  private isKeyboardAccessible(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const tabIndex = element.getAttribute('tabindex');
    
    // Naturally focusable elements
    const naturallyFocusable = ['a', 'button', 'input', 'select', 'textarea'];
    
    if (naturallyFocusable.includes(tagName)) {
      return true;
    }
    
    // Elements with tabindex >= 0 are focusable
    if (tabIndex !== null && parseInt(tabIndex, 10) >= 0) {
      return true;
    }
    
    // Elements with onclick should be keyboard accessible
    if (element.hasAttribute('onclick') && !tabIndex) {
      return false; // onclick without tabindex is not keyboard accessible
    }
    
    return true;
  }

  /**
   * Checks if tabindex value is valid
   */
  private isTabIndexValid(tabIndex: string | null): boolean {
    if (tabIndex === null) {
      return true;
    }
    
    const tabIndexNum = parseInt(tabIndex, 10);
    
    // tabindex > 0 is discouraged
    if (tabIndexNum > 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Checks if element has visible focus indicator
   */
  private hasFocusIndicator(computedStyle: CSSStyleDeclaration): boolean {
    // Check for outline
    if (computedStyle.outlineWidth !== '0px' && computedStyle.outlineStyle !== 'none') {
      return true;
    }
    
    // Could also check for box-shadow or border changes on :focus
    // For simplicity, we'll assume outline is the primary indicator
    
    return false;
  }

  /**
   * Gets description for keyboard issue
   */
  private getKeyboardIssueDescription(result: KeyboardResult): string {
    if (!result.isKeyboardAccessible) {
      return 'Interactive element is not keyboard accessible';
    } else if (!result.tabIndexValid) {
      return 'Element has invalid tabindex value (positive tabindex is discouraged)';
    } else if (!result.hasFocusIndicator) {
      return 'Interactive element missing visible focus indicator';
    }
    return 'Keyboard accessibility issue detected';
  }

  /**
   * Gets help text for keyboard issue
   */
  private getKeyboardIssueHelp(result: KeyboardResult): string {
    if (!result.isKeyboardAccessible) {
      return 'Element with onclick handler should have tabindex="0" to be keyboard accessible';
    } else if (!result.tabIndexValid) {
      return 'Avoid using positive tabindex values as they disrupt natural tab order';
    } else if (!result.hasFocusIndicator) {
      return 'Interactive elements must have visible focus indicator (outline, border, etc.)';
    }
    return 'Ensure element is fully keyboard accessible';
  }

  /**
   * Gets fix suggestions for keyboard issue
   */
  private getKeyboardFixSuggestions(result: KeyboardResult): string[] {
    const suggestions: string[] = [];
    
    if (!result.isKeyboardAccessible) {
      suggestions.push('Add tabindex="0" to make element keyboard focusable');
      suggestions.push('Consider using semantic button or link elements instead of div with onclick');
    }
    
    if (!result.tabIndexValid) {
      suggestions.push('Remove positive tabindex value and rely on natural document order');
      suggestions.push('Use tabindex="0" for elements that need to be focusable but not in a specific order');
    }
    
    if (!result.hasFocusIndicator) {
      suggestions.push('Add CSS outline on :focus state: element:focus { outline: 2px solid blue; }');
      suggestions.push('Ensure focus indicator has sufficient contrast and is clearly visible');
    }
    
    return suggestions;
  }
}
