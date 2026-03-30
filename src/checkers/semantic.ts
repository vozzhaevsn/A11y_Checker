import { AccessibilityIssue, ElementInfo } from '../types';
import { Logger } from '../utils/logger';

export class SemanticChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('SemanticChecker');
  }

  async check(): Promise<AccessibilityIssue[]> {
    try {
      this.logger.info('Starting semantic structure check');

      const issues: AccessibilityIssue[] = [];

      issues.push(...this.checkPageTitle());
      issues.push(...this.checkHeadings());
      issues.push(...this.checkLandmarks());
      issues.push(...this.checkFormLabels());

      this.logger.info(`Semantic check completed. Found ${issues.length} issues.`);
      return issues;
    } catch (error) {
      this.logger.error('Error during semantic check:', error);
      throw error;
    }
  }

  private checkPageTitle(): AccessibilityIssue[] {
    const title = document.title?.trim();
    if (!title) {
      return [
        {
          id: `missing-title-${Date.now()}`,
          element: this.bodyInfo(),
          description: 'Page is missing a <title> element',
          help: 'Every page should have a descriptive title',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html',
          impact: 'serious',
          tags: ['cat.structure', 'wcag2a', 'wcag242'],
          wcagLevels: ['A'],
          wcagCriteria: ['2.4.2'],
          fixSuggestions: ['Add a <title> element inside <head>'],
        },
      ];
    }
    return [];
  }

  private checkHeadings(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    const h1Count = headings.filter((h) => h.tagName === 'H1').length;
    if (h1Count === 0) {
      issues.push({
        id: `missing-h1-${Date.now()}`,
        element: this.bodyInfo(),
        description: 'Page is missing an H1 heading',
        help: 'Pages should have exactly one H1 heading',
        helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
        impact: 'moderate',
        tags: ['cat.structure', 'wcag2a', 'wcag131'],
        wcagLevels: ['A'],
        wcagCriteria: ['1.3.1'],
        fixSuggestions: ['Add an H1 heading that describes the page content'],
      });
    } else if (h1Count > 1) {
      issues.push({
        id: `multiple-h1-${Date.now()}`,
        element: this.bodyInfo(),
        description: `Page has ${h1Count} H1 headings (expected 1)`,
        help: 'Best practice is to have a single H1 per page',
        helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
        impact: 'minor',
        tags: ['cat.structure', 'best-practice'],
        wcagLevels: ['A'],
        wcagCriteria: ['1.3.1'],
        fixSuggestions: ['Consolidate to a single H1 and use H2+ for subsections'],
      });
    }

    let previousLevel = 0;
    headings.forEach((heading, i) => {
      const level = parseInt(heading.tagName.charAt(1), 10);
      if (previousLevel > 0 && level > previousLevel + 1) {
        issues.push({
          id: `heading-skip-${i}-${Date.now()}`,
          element: this.getElementInfo(heading),
          description: `Heading level jumps from H${previousLevel} to H${level}`,
          help: 'Heading levels should increase by one at a time',
          helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
          impact: 'moderate',
          tags: ['cat.structure', 'wcag2a', 'wcag131'],
          wcagLevels: ['A'],
          wcagCriteria: ['1.3.1'],
          fixSuggestions: [`Change to H${previousLevel + 1} or add intermediate heading`],
        });
      }
      previousLevel = level;
    });

    return issues;
  }

  private checkLandmarks(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    const required: Array<{ role: string; selectors: string; tag: string }> = [
      { role: 'main', selectors: 'main, [role="main"]', tag: 'main' },
      { role: 'banner', selectors: 'body > header, [role="banner"]', tag: 'header' },
      { role: 'navigation', selectors: 'nav, [role="navigation"]', tag: 'nav' },
    ];

    required.forEach(({ role, selectors, tag }) => {
      if (!document.querySelector(selectors)) {
        issues.push({
          id: `missing-landmark-${role}-${Date.now()}`,
          element: this.bodyInfo(),
          description: `Missing landmark: ${role}`,
          help: `Add a <${tag}> element or role="${role}" attribute`,
          helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/regions/',
          impact: 'moderate',
          tags: ['cat.structure', 'wcag2a', 'wcag131'],
          wcagLevels: ['A'],
          wcagCriteria: ['1.3.1'],
          fixSuggestions: [`Add <${tag}> element or an element with role="${role}"`],
        });
      }
    });

    return issues;
  }

  private checkFormLabels(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]), select, textarea',
    );

    inputs.forEach((input, index) => {
      if (this.inputHasLabel(input)) return;

      issues.push({
        id: `form-label-${index}-${Date.now()}`,
        element: this.getElementInfo(input),
        description: 'Form input missing associated label',
        help: 'All form inputs should have a label',
        helpUrl: 'https://www.w3.org/WAI/tutorials/forms/labels/',
        impact: 'serious',
        tags: ['cat.forms', 'wcag2a', 'wcag131', 'wcag332'],
        wcagLevels: ['A'],
        wcagCriteria: ['1.3.1', '3.3.2'],
        fixSuggestions: [
          'Add <label for="inputId">Label</label>',
          'Or use aria-label attribute',
        ],
      });
    });

    return issues;
  }

  private inputHasLabel(input: Element): boolean {
    const id = input.getAttribute('id');
    if (id && document.querySelector(`label[for="${id}"]`)) return true;

    let parent = input.parentElement;
    while (parent) {
      if (parent.tagName === 'LABEL') return true;
      parent = parent.parentElement;
    }

    return input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
  }

  private bodyInfo(): ElementInfo {
    return {
      tagName: 'body',
      attributes: {},
      position: { top: 0, right: 0, bottom: 0, left: 0 },
    };
  }

  private getElementInfo(element: Element): ElementInfo {
    const rect = element.getBoundingClientRect();
    const attrs: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes.item(i);
      if (attr) attrs[attr.name] = attr.value;
    }
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: (element instanceof HTMLElement ? element.className : '') || undefined,
      attributes: attrs,
      textContent: element.textContent?.trim() || undefined,
      position: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
    };
  }
}
