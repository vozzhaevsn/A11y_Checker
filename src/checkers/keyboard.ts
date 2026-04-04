import { KeyboardResult, AccessibilityIssue, ElementInfo } from '../types';
import { Logger } from '../utils/logger';
import type { AppLocale } from '../i18n/locale';
import {
  keyboardGenericDescription,
  keyboardHelpFocus,
  keyboardHelpGeneric,
  keyboardHelpNotAccessible,
  keyboardHelpTabIndex,
  keyboardNoFocusDescription,
  keyboardNotAccessibleDescription,
  keyboardSuggestFocusable,
  keyboardSuggestFocusStyle,
  keyboardSuggestTabIndex,
  keyboardTabIndexDescription,
} from '../i18n/checker-messages';

export class KeyboardChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('KeyboardChecker');
  }

  async check(locale: AppLocale = 'en'): Promise<AccessibilityIssue[]> {
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
            description: this.getDescription(locale, result),
            help: this.getHelp(locale, result),
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
            impact: result.isKeyboardAccessible ? 'moderate' : 'serious',
            tags: ['cat.keyboard', 'wcag2a', 'wcag211'],
            wcagLevels: ['A'],
            wcagCriteria: ['2.1.1'],
            fixSuggestions: this.getSuggestions(locale, result),
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

  private getDescription(locale: AppLocale, result: KeyboardResult): string {
    if (!result.isKeyboardAccessible) return keyboardNotAccessibleDescription(locale);
    if (!result.tabIndexValid) return keyboardTabIndexDescription(locale);
    if (!result.hasFocusIndicator) return keyboardNoFocusDescription(locale);
    return keyboardGenericDescription(locale);
  }

  private getHelp(locale: AppLocale, result: KeyboardResult): string {
    if (!result.isKeyboardAccessible) return keyboardHelpNotAccessible(locale);
    if (!result.tabIndexValid) return keyboardHelpTabIndex(locale);
    if (!result.hasFocusIndicator) return keyboardHelpFocus(locale);
    return keyboardHelpGeneric(locale);
  }

  private getSuggestions(locale: AppLocale, result: KeyboardResult): string[] {
    const suggestions: string[] = [];
    if (!result.isKeyboardAccessible) {
      suggestions.push(...keyboardSuggestFocusable(locale));
    }
    if (!result.tabIndexValid) {
      suggestions.push(...keyboardSuggestTabIndex(locale));
    }
    if (!result.hasFocusIndicator) {
      suggestions.push(...keyboardSuggestFocusStyle(locale));
    }
    return suggestions;
  }
}
