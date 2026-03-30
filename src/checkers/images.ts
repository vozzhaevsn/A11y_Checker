import { AccessibilityIssue, ElementInfo } from '../types';
import { Logger } from '../utils/logger';

export class ImageChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ImageChecker');
  }

  async check(): Promise<AccessibilityIssue[]> {
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
          issues.push(this.createIssue(el, 'Image missing alt attribute', 'critical', false));
        } else if (altAttr.trim() === '') {
          // empty but not explicitly decorative: already handled above (altAttr === '')
        } else if (this.isSuspiciousAlt(altAttr)) {
          issues.push(
            this.createIssue(
              el,
              `Image alt text is suspicious (generic): "${altAttr}"`,
              'moderate',
              true,
            ),
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

  private isSuspiciousAlt(alt: string): boolean {
    const generic = ['image', 'photo', 'picture', 'img', 'icon', 'graphic', 'logo', 'banner', 'untitled'];
    const lower = alt.toLowerCase().trim();
    return generic.includes(lower) || /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(lower);
  }

  private createIssue(
    el: Element,
    description: string,
    impact: 'critical' | 'serious' | 'moderate' | 'minor',
    hasAlt: boolean,
  ): AccessibilityIssue {
    return {
      id: `image-alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      element: this.getElementInfo(el),
      description,
      help: hasAlt
        ? 'Provide a meaningful alt text that describes the image content'
        : 'Add alt attribute: <img src="..." alt="description">',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
      impact,
      tags: ['cat.text-alternatives', 'wcag2a', 'wcag111'],
      wcagLevels: ['A'],
      wcagCriteria: ['1.1.1'],
      fixSuggestions: hasAlt
        ? ['Replace generic alt text with a meaningful description']
        : ['Add descriptive alt text', 'For decorative images, use alt=""'],
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
