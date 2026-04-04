import { ContrastRatioResult, AccessibilityIssue, ElementInfo } from '../types';
import { Logger } from '../utils/logger';
import type { AppLocale } from '../i18n/locale';
import {
  contrastFixSuggestions,
  contrastHelp,
  contrastInsufficientDescription,
} from '../i18n/checker-messages';

export class ContrastChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ContrastChecker');
  }

  async check(locale: AppLocale = 'en'): Promise<AccessibilityIssue[]> {
    try {
      this.logger.info('Starting color contrast check');

      const issues: AccessibilityIssue[] = [];
      const elements = this.getTextElements();

      for (const element of elements) {
        const result = this.checkElementContrast(element);

        if (!result.isValid) {
          issues.push({
            id: `contrast-${element.tagName}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            element,
            description: contrastInsufficientDescription(
              locale,
              result.ratio,
              this.getRequiredLevel(result.requiredRatio),
            ),
            help: contrastHelp(locale, result.ratio, result.requiredRatio),
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
            impact: this.determineImpactLevel(result.ratio, result.requiredRatio),
            tags: ['cat.color', 'wcag2aa', 'wcag143'],
            wcagLevels: ['AA'],
            wcagCriteria: ['1.4.3'],
            fixSuggestions: contrastFixSuggestions(
              locale,
              result.foregroundColor,
              result.backgroundColor,
              result.requiredRatio,
            ),
          });
        }
      }

      this.logger.info(`Color contrast check completed. Found ${issues.length} issues.`);
      return issues;
    } catch (error) {
      this.logger.error('Error during color contrast check:', error);
      throw error;
    }
  }

  private getTextElements(): ElementInfo[] {
    const elements: ElementInfo[] = [];

    const textElements = document.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, span, a, button, label, li, td, th',
    );

    textElements.forEach((el: Element) => {
      const computedStyle = window.getComputedStyle(el);
      const textContent = el.textContent?.trim() || '';

      if (
        computedStyle.display === 'none' ||
        computedStyle.visibility === 'hidden' ||
        computedStyle.opacity === '0' ||
        textContent === ''
      ) {
        return;
      }

      const rect = el.getBoundingClientRect();

      elements.push({
        tagName: el.tagName.toLowerCase(),
        id: el.id || undefined,
        className: (el instanceof HTMLElement ? el.className : undefined) || undefined,
        attributes: this.getElementAttributes(el),
        textContent,
        position: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
      });
    });

    return elements;
  }

  private checkElementContrast(element: ElementInfo): ContrastRatioResult {
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
      return { ratio: 0, isValid: false, requiredRatio: 4.5, foregroundColor: '', backgroundColor: '', element };
    }

    const computedStyle = window.getComputedStyle(domElement);
    const fontSize = parseFloat(computedStyle.fontSize);
    const fontWeight = computedStyle.fontWeight;
    const isLargeText =
      fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight, 10) >= 600));

    const fgColor = this.parseColor(computedStyle.color);
    const bgColor = this.getBackgroundColor(domElement);

    const ratio = this.calculateContrastRatio(fgColor, bgColor);
    const requiredRatio = isLargeText ? 3.0 : 4.5;

    return {
      ratio,
      isValid: ratio >= requiredRatio,
      requiredRatio,
      foregroundColor: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      element,
    };
  }

  private getBackgroundColor(element: Element): [number, number, number, number] {
    let currentElement: Element | null = element;

    while (currentElement) {
      const bg = window.getComputedStyle(currentElement).backgroundColor;

      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        return this.parseColor(bg);
      }

      currentElement = currentElement.parentElement;
    }

    return [255, 255, 255, 1];
  }

  parseColor(color: string): [number, number, number, number] {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0]! + hex[0]!, 16),
          parseInt(hex[1]! + hex[1]!, 16),
          parseInt(hex[2]! + hex[2]!, 16),
          1,
        ];
      }
      if (hex.length === 6) {
        return [
          parseInt(hex.substring(0, 2), 16),
          parseInt(hex.substring(2, 4), 16),
          parseInt(hex.substring(4, 6), 16),
          1,
        ];
      }
    }

    const rgbMatch = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\)/);
    if (rgbMatch) {
      return [
        Number(rgbMatch[1]),
        Number(rgbMatch[2]),
        Number(rgbMatch[3]),
        rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : 1,
      ];
    }

    return [0, 0, 0, 1];
  }

  calculateContrastRatio(
    color1: [number, number, number, number],
    color2: [number, number, number, number],
  ): number {
    const lum1 = this.relativeLuminance(color1);
    const lum2 = this.relativeLuminance(color2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  relativeLuminance(color: [number, number, number, number]): number {
    const [r, g, b] = color;

    const RsRGB = r / 255;
    const GsRGB = g / 255;
    const BsRGB = b / 255;

    const R = RsRGB <= 0.03928 ? RsRGB / 12.92 : Math.pow((RsRGB + 0.055) / 1.055, 2.4);
    const G = GsRGB <= 0.03928 ? GsRGB / 12.92 : Math.pow((GsRGB + 0.055) / 1.055, 2.4);
    const B = BsRGB <= 0.03928 ? BsRGB / 12.92 : Math.pow((BsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  private getRequiredLevel(requiredRatio: number): string {
    if (requiredRatio >= 7.0) return 'AAA';
    if (requiredRatio >= 4.5) return 'AA';
    return 'A';
  }

  private determineImpactLevel(
    ratio: number,
    requiredRatio: number,
  ): 'critical' | 'serious' | 'moderate' | 'minor' {
    const diff = requiredRatio - ratio;
    if (diff >= 2.0) return 'critical';
    if (diff >= 1.0) return 'serious';
    if (diff > 0.1) return 'moderate';
    return 'minor';
  }

  private getElementAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes.item(i);
      if (attr) attrs[attr.name] = attr.value;
    }
    return attrs;
  }
}
