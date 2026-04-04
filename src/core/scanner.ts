import {
  AxeCoreResult,
  AxeViolation,
  AxeNode,
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
import { localizeAxeFailureSummary } from '../i18n/axe-failure-summary';

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

  async scanPage(url: string): Promise<ScanResult> {
    try {
      this.logger.info(`Starting accessibility scan for ${url}`);

      const axeResults = await this.axeEngine.scan(this.settings);

      let issues: AccessibilityIssue[] = [];

      const locale = this.settings.locale;

      if (this.settings.includeColorContrast) {
        const contrastIssues = await this.contrastChecker.check(locale);
        issues = [...issues, ...contrastIssues];
      }

      if (this.settings.includeImages) {
        const imageIssues = await this.imageChecker.check(locale);
        issues = [...issues, ...imageIssues];
      }

      if (this.settings.includeSemantics) {
        const semanticIssues = await this.semanticChecker.check(locale);
        issues = [...issues, ...semanticIssues];
      }

      if (this.settings.includeKeyboard) {
        const keyboardIssues = await this.keyboardChecker.check(locale);
        issues = [...issues, ...keyboardIssues];
      }

      const combinedIssues = [...issues, ...this.mapAxeResults(axeResults)];
      const summary = this.calculateSummary(combinedIssues);

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

  private mapAxeResults(axeResults: AxeCoreResult): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    axeResults.violations.forEach((violation: AxeViolation) => {
      violation.nodes.forEach((node: AxeNode) => {
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
          fixSuggestions: node.failureSummary
            ? [localizeAxeFailureSummary(node.failureSummary, this.settings.locale)]
            : [],
        };

        issues.push(issue);
      });
    });

    return issues;
  }

  private mapElement(node: AxeNode): ElementInfo {
    const targetSelector = Array.isArray(node.target) ? node.target[0] : undefined;

    const rect: Rectangle = targetSelector
      ? this.getElementRect(targetSelector)
      : { top: 0, right: 0, bottom: 0, left: 0 };

    return {
      tagName: targetSelector ? this.getTagName(targetSelector) : 'unknown',
      id: targetSelector ? this.getElementId(targetSelector) : undefined,
      className: targetSelector ? this.getClassName(targetSelector) : undefined,
      attributes: {},
      textContent: targetSelector ? this.getElementText(targetSelector) : undefined,
      position: rect,
    };
  }

  private getTagName(target: string): string {
    const match = target.match(/^[^#.[:\s]+/);
    return match ? match[0] : 'unknown';
  }

  private getElementId(target: string): string | undefined {
    const match = target.match(/#([^.[:\s]+)/);
    return match ? match[1] : undefined;
  }

  private getClassName(target: string): string | undefined {
    const matches = target.match(/\.[^.[:\s]+/g);
    return matches ? matches.map((cls) => cls.substring(1)).join(' ') : undefined;
  }

  private getElementText(target: string): string | undefined {
    try {
      const element = document.querySelector(target);
      if (!element) return undefined;
      const text = element.textContent?.trim() ?? '';
      return text || undefined;
    } catch {
      return undefined;
    }
  }

  private getElementRect(target: string): Rectangle {
    try {
      const element = document.querySelector(target) as HTMLElement | null;
      if (!element) return { top: 0, right: 0, bottom: 0, left: 0 };

      const rect = element.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const left = rect.left + window.scrollX;

      return {
        top,
        right: left + rect.width,
        bottom: top + rect.height,
        left,
      };
    } catch {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }
  }

  private mapImpactLevel(axeImpact: string): 'critical' | 'serious' | 'moderate' | 'minor' {
    switch (axeImpact) {
      case 'critical':
        return 'critical';
      case 'serious':
        return 'serious';
      case 'moderate':
        return 'moderate';
      default:
        return 'minor';
    }
  }

  private extractWcagLevels(tags: string[]): ('A' | 'AA' | 'AAA')[] {
    const levels: ('A' | 'AA' | 'AAA')[] = [];

    tags.forEach((tag) => {
      if (tag.includes('wcag')) {
        if (tag.includes('aaa')) {
          levels.push('AAA');
        } else if (tag.includes('aa') && !tag.includes('aaa')) {
          levels.push('AA');
        } else if (/wcag\d+a$/.test(tag) || /wcag2a/.test(tag)) {
          levels.push('A');
        }
      }
    });

    return levels.length > 0 ? levels : ['A'];
  }

  private extractWcagCriteria(tags: string[]): string[] {
    return tags.filter((tag) => /^wcag\d{3,}$/.test(tag));
  }

  private calculateSummary(issues: AccessibilityIssue[]): ScanResult['summary'] {
    const summary = { total: issues.length, critical: 0, serious: 0, moderate: 0, minor: 0 };

    issues.forEach((issue) => {
      summary[issue.impact]++;
    });

    return summary;
  }

  private generateId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
