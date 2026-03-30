import { KeyboardResult, AccessibilityIssue, ElementInfo } from '../types';
import { Logger } from '../utils/logger';

export class KeyboardChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('KeyboardChecker');
  }

  async check(): Promise<AccessibilityIssue[]> {
    try {
      this.logger.info('Starting keyboard accessibility check');

      const issues: AccessibilityIssue[] = [];
      const interactiveElements = this.getInteractiveElements();

      for (const element of interactiveElements) {
        const result = this.checkKeyboardAccess(element);

        if (!result.isValid) {
          issues.push({
            id: `keyboard-${element.tagName}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            element,
            description: this.getDescription(result),
            help: this.getHelp(result),
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
            impact: result.isKeyboardAccessible ? 'moderate' : 'serious',
            tags: ['cat.keyboard', 'wcag2a', 'wcag211'],
            wcagLevels: ['A'],
            wcagCriteria: ['2.1.1'],
            fixSuggestions: this.getSuggestions(result),
          });
        }
      }

      this.logger.info(`Keyboard check completed. Found ${issues.length} issues.`);
      return issues;
    } catch (error) {
      this.logger.error('Error during keyboard check:', error);
      throw error;
    }
  }

  private getInteractiveElements(): ElementInfo[] {
    const elements: ElementInfo[] = [];

    const selector =
      'a, button, input:not([type="hidden"]), select, textarea, [tabindex], [onclick], [role="button"], [role="link"]';

    document.querySelectorAll(selector).forEach((el: Element) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

      const rect = el.getBoundingClientRect();
      const attrs: Record<string, string> = {};
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes.item(i);
        if (attr) attrs[attr.name] = attr.value;
      }

      elements.push({
        tagName: el.tagName.toLowerCase(),
        id: el.id || undefined,
        className: (el instanceof HTMLElement ? el.className : '') || undefined,
        attributes: attrs,
        textContent: el.textContent?.trim() || undefined,
        position: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
      });
    });

    return elements;
  }

  private checkKeyboardAccess(element: ElementInfo): KeyboardResult {
    let domElement: Element | null = null;

    if (element.id) {
      domElement = document.getElementById(element.id);
    }
    if (!domElement) {
      try {
        const sel = `${element.tagName}${element.className ? '.' + element.className.replace(/\s+/g, '.') : ''}`;
        domElement = document.querySelector(sel);
      } catch {
        /* invalid selector */
      }
    }

    if (!domElement) {
      return { element, hasFocusIndicator: false, isKeyboardAccessible: false, tabIndexValid: false, isValid: false };
    }

    const tabIndex = domElement.getAttribute('tabindex');
    const isKeyboardAccessible = this.isKeyboardAccessible(domElement);
    const tabIndexValid = this.isTabIndexValid(tabIndex);
    const hasFocusIndicator = this.hasFocusIndicator(window.getComputedStyle(domElement));

    return {
      element,
      hasFocusIndicator,
      isKeyboardAccessible,
      tabIndexValid,
      isValid: isKeyboardAccessible && tabIndexValid && hasFocusIndicator,
    };
  }

  private isKeyboardAccessible(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const tabIndex = element.getAttribute('tabindex');

    const focusable = ['a', 'button', 'input', 'select', 'textarea'];
    if (focusable.includes(tagName)) return true;
    if (tabIndex !== null && parseInt(tabIndex, 10) >= 0) return true;
    if (element.hasAttribute('onclick') && !tabIndex) return false;

    return true;
  }

  private isTabIndexValid(tabIndex: string | null): boolean {
    if (tabIndex === null) return true;
    return parseInt(tabIndex, 10) <= 0;
  }

  private hasFocusIndicator(style: CSSStyleDeclaration): boolean {
    return style.outlineWidth !== '0px' && style.outlineStyle !== 'none';
  }

  private getDescription(result: KeyboardResult): string {
    if (!result.isKeyboardAccessible) return 'Interactive element is not keyboard accessible';
    if (!result.tabIndexValid) return 'Element has positive tabindex (disrupts tab order)';
    if (!result.hasFocusIndicator) return 'Element missing visible focus indicator';
    return 'Keyboard accessibility issue detected';
  }

  private getHelp(result: KeyboardResult): string {
    if (!result.isKeyboardAccessible) return 'Add tabindex="0" or use a semantic interactive element';
    if (!result.tabIndexValid) return 'Avoid positive tabindex values';
    if (!result.hasFocusIndicator) return 'Add a visible :focus style (outline, border, etc.)';
    return 'Ensure element is fully keyboard accessible';
  }

  private getSuggestions(result: KeyboardResult): string[] {
    const suggestions: string[] = [];
    if (!result.isKeyboardAccessible) {
      suggestions.push('Add tabindex="0" to make element focusable');
      suggestions.push('Or use <button> / <a> instead of <div> with onclick');
    }
    if (!result.tabIndexValid) {
      suggestions.push('Replace positive tabindex with tabindex="0"');
    }
    if (!result.hasFocusIndicator) {
      suggestions.push('Add CSS: element:focus { outline: 2px solid #667eea; }');
    }
    return suggestions;
  }
}
