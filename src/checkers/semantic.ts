import { SemanticResult, AccessibilityIssue, ElementInfo } from '../types';
import { Logger } from '../utils/logger';

/**
 * Semantic structure checker implementation
 * Evaluates proper use of HTML semantics according to WCAG guidelines
 */
export class SemanticChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('SemanticChecker');
  }

  /**
   * Checks semantic structure of the page
   * @returns Promise resolving to array of semantic-related accessibility issues
   */
  async check(): Promise<AccessibilityIssue[]> {
    try {
      this.logger.info('Starting semantic structure check');
      
      const issues: AccessibilityIssue[] = [];
      
      const headingIssues = this.checkHeadings();
      issues.push(...headingIssues);
      
      const landmarkIssues = this.checkLandmarks();
      issues.push(...landmarkIssues);
      
      const formIssues = this.checkFormSemantics();
      issues.push(...formIssues);
      
      this.logger.info(`Semantic structure check completed. Found ${issues.length} issues.`);
      return issues;
    } catch (error) {
      this.logger.error('Error during semantic structure check:', error);
      throw error;
    }
  }

  /**
   * Checks heading hierarchy for proper structure
   */
  private checkHeadings(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    
    let previousLevel = 0;
    
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i] as HTMLElement;
      const level = parseInt(heading.tagName.charAt(1), 10);
      
      if (level > previousLevel + 1) {
        const elementInfo: ElementInfo = this.getElementInfo(heading);
        
        const issue: AccessibilityIssue = {
          id: `heading-${i}-${Date.now()}`,
          element: elementInfo,
          description: `Heading level skipped from H${previousLevel} to H${level}, skipping H${previousLevel + 1}`,
          help: `Headings should increase by only one level at a time (e.g., H1 -> H2, not H1 -> H3)`,
          helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
          impact: 'moderate',
          tags: ['cat.structure', 'wcag2a', 'wcag131'],
          wcagLevels: ['A'],
          wcagCriteria: ['1.3.1'],
          fixSuggestions: [
            `Change heading level from H${level} to H${previousLevel + 1}`,
            `Or add an intermediate heading (H${previousLevel + 1}) before this heading`
          ]
        };
        
        issues.push(issue);
      }
      
      previousLevel = level;
    }
    
    return issues;
  }

  /**
   * Checks for proper landmark regions
   */
  private checkLandmarks(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    const requiredLandmarks = ['banner', 'main', 'navigation'];
    const foundLandmarks: string[] = [];
    
    const landmarkElements = [
      ...Array.from(document.querySelectorAll('[role="banner"], header')),
      ...Array.from(document.querySelectorAll('[role="main"], main')),
      ...Array.from(document.querySelectorAll('[role="navigation"], nav')),
      ...Array.from(document.querySelectorAll('[role="complementary"], aside')),
      ...Array.from(document.querySelectorAll('[role="contentinfo"], footer')),
      ...Array.from(document.querySelectorAll('[role="search"]'))
    ];
    
    landmarkElements.forEach((element: Element) => {
      const role = element.getAttribute('role');
      const tagName = element.tagName.toLowerCase();
      
      let landmarkRole = role;
      if (!landmarkRole) {
        switch (tagName) {
          case 'header':
            landmarkRole = 'banner';
            break;
          case 'main':
            landmarkRole = 'main';
            break;
          case 'nav':
            landmarkRole = 'navigation';
            break;
          case 'aside':
            landmarkRole = 'complementary';
            break;
          case 'footer':
            landmarkRole = 'contentinfo';
            break;
          default:
            break;
        }
      }
      
      if (landmarkRole && !foundLandmarks.includes(landmarkRole)) {
        foundLandmarks.push(landmarkRole);
      }
    });
    
    requiredLandmarks.forEach(landmark => {
      if (!foundLandmarks.includes(landmark)) {
        const issue: AccessibilityIssue = {
          id: `missing-landmark-${landmark}-${Date.now()}`,
          element: {
            tagName: 'body',
            id: undefined,
            className: undefined,
            attributes: {},
            textContent: undefined,
            position: { top: 0, right: 0, bottom: 0, left: 0 }
          },
          description: `Missing required landmark region: ${landmark}`,
          help: `Page should include a ${landmark} landmark region to improve navigation for assistive technology users`,
          helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/regions/',
          impact: 'moderate',
          tags: ['cat.structure', 'wcag2a', 'wcag131'],
          wcagLevels: ['A'],
          wcagCriteria: ['1.3.1'],
          fixSuggestions: [
            `Add a ${landmark} landmark using either semantic HTML (<${this.getSemanticTag(landmark)}>) or ARIA role (role="${landmark}")`
          ]
        };
        
        issues.push(issue);
      }
    });
    
    return issues;
  }

  /**
   * Checks form semantics for proper labeling and structure
   */
  private checkFormSemantics(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]), select, textarea'
    );
    
    inputs.forEach((input: Element, index: number) => {
      const hasLabel = this.inputHasLabel(input);
      
      if (!hasLabel) {
        const elementInfo: ElementInfo = this.getElementInfo(input);
        
        const issue: AccessibilityIssue = {
          id: `form-label-${index}-${Date.now()}`,
          element: elementInfo,
          description: `Form input missing associated label`,
          help: `All form inputs should have an associated label element for accessibility`,
          helpUrl: 'https://www.w3.org/WAI/tutorials/forms/labels/',
          impact: 'serious',
          tags: ['cat.forms', 'wcag2a', 'wcag131', 'wcag332'],
          wcagLevels: ['A'],
          wcagCriteria: ['1.3.1', '3.3.2'],
          fixSuggestions: [
            `Add a label element: <label for="inputId">Label text</label>`,
            `Or wrap input in label: <label>Label text <input .../></label>`,
            `Or use aria-label: <input aria-label="Label text" .../>`
          ]
        };
        
        issues.push(issue);
      }
    });
    
    return issues;
  }

  /**
   * Checks if an input has an associated label
   */
  private inputHasLabel(input: Element): boolean {
    const id = input.getAttribute('id');
    
    // Check for label with for attribute
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        return true;
      }
    }
    
    // Check if input is wrapped in label
    let parent = input.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === 'label') {
        return true;
      }
      parent = parent.parentElement;
    }
    
    // Check for aria-label or aria-labelledby
    if (input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby')) {
      return true;
    }
    
    return false;
  }

  /**
   * Gets semantic tag for a landmark role
   */
  private getSemanticTag(landmark: string): string {
    switch (landmark) {
      case 'banner':
        return 'header';
      case 'main':
        return 'main';
      case 'navigation':
        return 'nav';
      case 'complementary':
        return 'aside';
      case 'contentinfo':
        return 'footer';
      default:
        return 'div';
    }
  }

  /**
   * Gets element information
   */
  private getElementInfo(element: Element): ElementInfo {
    const rect = element.getBoundingClientRect();
    const attrs: { [key: string]: string } = {};
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes.item(i);
      if (!attr) continue;
      attrs[attr.name] = attr.value;
    }
    
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: (element as HTMLElement).className || undefined,
      attributes: attrs,
      textContent: element.textContent || undefined,
      position: {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left
      }
    };
  }
}
