import { AccessibilityIssue, ElementInfo } from '../types';
import { Logger } from '../utils/logger';
import type { AppLocale } from '../i18n/locale';
import {
  genericAltTokens,
  imageFixMeaningful,
  imageFixMissing,
  imageHelpMeaningful,
  imageHelpMissing,
  imageMissingAlt,
  imageSuspiciousAlt,
} from '../i18n/checker-messages';

export class ImageChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ImageChecker');
  }

  async check(locale: AppLocale = 'en'): Promise<AccessibilityIssue[]> {
    try {
      this.logger.info('Starting image accessibility check');

      const issues: AccessibilityIssue[] = [];
      const images = document.querySelectorAll('img, [role="img"]');

      images.forEach((el: Element) => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

        const altAttr = el.getAttribute('alt');
        const role = el.getAttribute('role');
        const ariaHidden = el.getAttribute('aria-hidden');

        const hasAlt = altAttr !== null;
        const isExplicitlyDecorative =
          role === 'presentation' || role === 'none' || ariaHidden === 'true' || altAttr === '';

        if (isExplicitlyDecorative) return;

        if (!hasAlt) {
          issues.push(this.createIssue(locale, el, imageMissingAlt(locale), 'critical', false));
        } else if (altAttr.trim() === '') {
          // empty but not explicitly decorative: already handled above (altAttr === '')
        } else if (this.isSuspiciousAlt(altAttr, locale)) {
          issues.push(
            this.createIssue(locale, el, imageSuspiciousAlt(locale, altAttr), 'moderate', true),
          );
        }
      });

      this.logger.info(`Image check completed. Found ${issues.length} issues.`);
      return issues;
    } catch (error) {
      this.logger.error('Error during image check:', error);
      throw error;
    }
  }

  private isSuspiciousAlt(alt: string, locale: AppLocale): boolean {
    const generic = genericAltTokens(locale);
    const lower = alt.toLowerCase().trim();
    return generic.includes(lower) || /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(lower);
  }

  private createIssue(
    locale: AppLocale,
    el: Element,
    description: string,
    impact: 'critical' | 'serious' | 'moderate' | 'minor',
    hasAlt: boolean,
  ): AccessibilityIssue {
    return {
      id: `image-alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      element: this.getElementInfo(el),
      description,
      help: hasAlt ? imageHelpMeaningful(locale) : imageHelpMissing(locale),
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
      impact,
      tags: ['cat.text-alternatives', 'wcag2a', 'wcag111'],
      wcagLevels: ['A'],
      wcagCriteria: ['1.1.1'],
      fixSuggestions: hasAlt ? imageFixMeaningful(locale) : imageFixMissing(locale),
    };
  }

  private getElementInfo(el: Element): ElementInfo {
    const rect = el.getBoundingClientRect();
    const attrs: Record<string, string> = {};
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes.item(i);
      if (attr) attrs[attr.name] = attr.value;
    }
    return {
      tagName: el.tagName.toLowerCase(),
      id: el.id || undefined,
      className: (el instanceof HTMLElement ? el.className : '') || undefined,
      attributes: attrs,
      textContent: el.textContent?.trim() || undefined,
      position: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
    };
  }
}
