import {
  AxeCoreResult,
  ScanResult,
  AccessibilityIssue,
  Settings,
  ElementInfo,
  Rectangle,
} from '../types';
import { AxeEngine } from './axe-engine';
import { ContrastChecker } from '../checkers/contrast';
import { ImageChecker } from '../checkers/images';
import { SemanticChecker } from '../checkers/semantic';
import { KeyboardChecker } from '../checkers/keyboard';
import { Logger } from '../utils/logger';

/**
 * Main accessibility scanner class
 * Orchestrates scanning process using multiple checkers
 */
export class Scanner {
  private axeEngine: AxeEngine;
  private contrastChecker: ContrastChecker;
  private imageChecker: ImageChecker;
  private semanticChecker: SemanticChecker;
  private keyboardChecker: KeyboardChecker;
  private logger: Logger;

  constructor(private settings: Settings) {
    this.axeEngine = new AxeEngine();
    this.contrastChecker = new ContrastChecker();
    this.imageChecker = new ImageChecker();
    this.semanticChecker = new SemanticChecker();
    this.keyboardChecker = new KeyboardChecker();
    this.logger = new Logger('Scanner');
  }

  /**
   * Performs comprehensive accessibility scan of the current page
   * @param url The URL of the page being scanned
   * @returns Promise resolving to ScanResult
   */
  async scanPage(url: string): Promise<ScanResult> {
    try {
      this.logger.info(`Starting accessibility scan for ${url}`);

      // Run axe-core scan with settings
      const axeResults = await this.axeEngine.scan(this.settings);

      // Run custom checkers based on settings
      let issues: AccessibilityIssue[] = [];

      if (this.settings.includeColorContrast) {
        const contrastIssues = await this.contrastChecker.check();
        issues = [...issues, ...contrastIssues];
      }

      if (this.settings.includeImages) {
        const imageIssues = await this.imageChecker.check();
        issues = [...issues, ...imageIssues];
      }

      if (this.settings.includeSemantics) {
        const semanticIssues = await this.semanticChecker.check();
        issues = [...issues, ...semanticIssues];
      }

      if (this.settings.includeKeyboard) {
        const keyboardIssues = await this.keyboardChecker.check();
        issues = [...issues, ...keyboardIssues];
      }

      // Combine axe results with custom checks
      const combinedIssues = [...issues, ...this.mapAxeResults(axeResults)];

      // Calculate summary statistics
      const summary = this.calculateSummary(combinedIssues);

      // Create scan result
      const result: ScanResult = {
        id: this.generateId(),
        url,
        timestamp: Date.now(),
        summary,
        issues: combinedIssues,
        wcagLevel: this.settings.wcagLevel,
      };

      this.logger.info(`Scan completed. Found ${combinedIssues.length} issues`);
      return result;
    } catch (error) {
      this.logger.error('Error during scan:', error);
      throw error;
    }
  }

  /**
   * Maps axe-core results to our internal AccessibilityIssue format
   */
  private mapAxeResults(axeResults: AxeCoreResult): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Process violations
    axeResults.violations.forEach((violation) => {
      violation.nodes.forEach((node: any) => {
        const issue: AccessibilityIssue = {
          id: violation.id,
          element: this.mapElement(node),
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          impact: this.mapImpactLevel(violation.impact),
          tags: violation.tags,
          wcagLevels: this.extractWcagLevels(violation.tags),
          wcagCriteria: this.extractWcagCriteria(violation.tags),
          fixSuggestions: node.failureSummary ? [node.failureSummary] : [],
        };

        issues.push(issue);
      });
    });

    return issues;
  }

  /**
   * Maps axe-core node to our ElementInfo format
   */
  private mapElement(node: any): ElementInfo {
    const targetSelector = Array.isArray(node.target) ? node.target[0] : node.target;

    const rect = targetSelector
      ? this.getElementRect(targetSelector)
      : {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };

    return {
      tagName: targetSelector ? this.getTagName(targetSelector) : 'unknown',
      id: targetSelector ? this.getElementId(targetSelector) : undefined,
      className: targetSelector ? this.getClassName(targetSelector) : undefined,
      attributes: node.all || {},
      textContent: targetSelector ? this.getElementText(targetSelector) : undefined,
      position: rect,
    };
  }

  /**
   * Gets tag name from target selector
   */
  private getTagName(target: string): string {
    if (typeof target === 'string') {
      const match = target.match(/^[^#\.\\[\:\s]+/);
      return match ? match[0] : 'unknown';
    }
    return 'unknown';
  }

  /**
   * Gets element ID from target selector
   */
  private getElementId(target: string): string | undefined {
    if (typeof target === 'string') {
      const match = target.match(/#([^\.\\[\:\s]+)/);
      return match ? match[1] : undefined;
    }
    return undefined;
  }

  /**
   * Gets element class from target selector
   */
  private getClassName(target: string): string | undefined {
    if (typeof target === 'string') {
      const matches = target.match(/\.[^\.\\[\:\s]+/g);
      return matches ? matches.map((cls) => cls.substring(1)).join(' ') : undefined;
    }
    return undefined;
  }

  /**
   * Gets element text content
   */
  private getElementText(target: string): string | undefined {
    try {
      const element = document.querySelector(target);
      if (!element) {
        return undefined;
      }
      const text = element.textContent?.trim() ?? '';
      return text || undefined;
    } catch (error) {
      this.logger.warn('Failed to get element text for selector', target, error);
      return undefined;
    }
  }

  /**
   * Gets element rectangle (position/size)
   */
  private getElementRect(target: string): Rectangle {
    try {
      const element = document.querySelector(target) as HTMLElement | null;
      if (!element) {
        return {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        };
      }

      const rect = element.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const left = rect.left + window.scrollX;

      return {
        top,
        right: left + rect.width,
        bottom: top + rect.height,
        left,
      };
    } catch (error) {
      this.logger.warn('Failed to get element rect for selector', target, error);
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
    }
  }

  /**
   * Maps axe-core impact level to our internal impact levels
   */
  private mapImpactLevel(axeImpact: string): 'critical' | 'serious' | 'moderate' | 'minor' {
    switch (axeImpact) {
      case 'critical':
        return 'critical';
      case 'serious':
        return 'serious';
      case 'moderate':
        return 'moderate';
      case 'minor':
        return 'minor';
      default:
        return 'minor';
    }
  }

  /**
   * Extracts WCAG levels from tags
   */
  private extractWcagLevels(tags: string[]): ('A' | 'AA' | 'AAA')[] {
    const levels: ('A' | 'AA' | 'AAA')[] = [];

    tags.forEach((tag) => {
      if (tag.includes('wcag')) {
        if (tag.includes('aaa')) {
          levels.push('AAA');
        } else if (tag.includes('aa')) {
          levels.push('AA');
        } else if (tag.includes('a')) {
          levels.push('A');
        }
      }
    });

    return levels.length > 0 ? levels : ['A'];
  }

  /**
   * Extracts WCAG criteria from tags
   */
  private extractWcagCriteria(tags: string[]): string[] {
    return tags.filter((tag) => tag.startsWith('wcag') && !tag.includes('level'));
  }

  /**
   * Calculates summary statistics from issues
   */
  private calculateSummary(issues: AccessibilityIssue[]): ScanResult['summary'] {
    const summary = {
      total: issues.length,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };

    issues.forEach((issue) => {
      switch (issue.impact) {
        case 'critical':
          summary.critical++;
          break;
        case 'serious':
          summary.serious++;
          break;
        case 'moderate':
          summary.moderate++;
          break;
        case 'minor':
          summary.minor++;
          break;
      }
    });

    return summary;
  }

  /**
   * Generates unique ID for scan result
   */
  private generateId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
