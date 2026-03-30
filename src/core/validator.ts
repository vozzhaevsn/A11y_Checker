import { Settings, AccessibilityIssue } from '../types';
import { Logger } from '../utils/logger';

export class Validator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('Validator');
  }

  validateWcagCompliance(issues: AccessibilityIssue[], wcagLevel: 'A' | 'AA' | 'AAA'): boolean {
    this.logger.info(`Validating WCAG ${wcagLevel} compliance for ${issues.length} issues`);

    for (const issue of issues) {
      if (issue.impact === 'critical' || issue.impact === 'serious') return false;
      if ((wcagLevel === 'AA' || wcagLevel === 'AAA') && issue.impact === 'moderate') return false;
      if (wcagLevel === 'AAA' && issue.impact === 'minor') return false;
    }

    return true;
  }

  validateSettings(settings: Settings): boolean {
    if (!settings) return false;
    if (!['A', 'AA', 'AAA'].includes(settings.wcagLevel)) return false;
    if (!['light', 'dark'].includes(settings.theme)) return false;
    return true;
  }

  validateScanResults(scanResults: unknown): boolean {
    if (!scanResults || typeof scanResults !== 'object') return false;

    const r = scanResults as Record<string, unknown>;
    const requiredProps = ['id', 'url', 'timestamp', 'summary', 'issues', 'wcagLevel'];
    for (const prop of requiredProps) {
      if (!(prop in r)) return false;
    }

    if (typeof r['id'] !== 'string') return false;
    if (typeof r['url'] !== 'string') return false;
    if (typeof r['timestamp'] !== 'number') return false;
    if (!Array.isArray(r['issues'])) return false;
    if (!['A', 'AA', 'AAA'].includes(r['wcagLevel'] as string)) return false;

    return true;
  }
}
