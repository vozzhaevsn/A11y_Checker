import { Settings, AccessibilityIssue } from '../types';
import { Logger } from '../utils/logger';

/**
 * Validator class for checking accessibility standards compliance
 */
export class Validator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('Validator');
  }

  /**
   * Validates if the issues meet the specified WCAG level requirements
   * @param issues List of accessibility issues found
   * @param wcagLevel The WCAG level to validate against (A, AA, or AAA)
   * @returns Boolean indicating if the page passes validation
   */
  validateWcagCompliance(issues: AccessibilityIssue[], wcagLevel: 'A' | 'AA' | 'AAA'): boolean {
    try {
      this.logger.info(`Validating WCAG ${wcagLevel} compliance for ${issues.length} issues`);
      
      let hasFailures = false;
      
      for (const issue of issues) {
        // Critical and serious issues are always failures for all levels
        if (issue.impact === 'critical' || issue.impact === 'serious') {
          hasFailures = true;
          break;
        }
        
        // For AA and AAA, moderate issues might also be considered failures
        if ((wcagLevel === 'AA' || wcagLevel === 'AAA') && issue.impact === 'moderate') {
          hasFailures = true;
          break;
        }
        
        // For AAA, even minor issues might be considered failures
        if (wcagLevel === 'AAA' && issue.impact === 'minor') {
          hasFailures = true;
          break;
        }
      }
      
      const isValid = !hasFailures;
      this.logger.info(`WCAG ${wcagLevel} validation result: ${isValid ? 'PASS' : 'FAIL'}`);
      
      return isValid;
    } catch (error) {
      this.logger.error('Error during WCAG validation:', error);
      throw error;
    }
  }

  /**
   * Validates settings configuration
   * @param settings The settings to validate
   * @returns Boolean indicating if settings are valid
   */
  validateSettings(settings: Settings): boolean {
    try {
      this.logger.info('Validating settings configuration');
      
      if (!settings) {
        this.logger.error('Settings object is null or undefined');
        return false;
      }
      
      // Validate WCAG level
      if (!['A', 'AA', 'AAA'].includes(settings.wcagLevel)) {
        this.logger.error(`Invalid WCAG level: ${settings.wcagLevel}`);
        return false;
      }
      
      // Validate theme
      if (!['light', 'dark'].includes(settings.theme)) {
        this.logger.error(`Invalid theme: ${settings.theme}`);
        return false;
      }
      
      this.logger.info('Settings validation passed');
      return true;
    } catch (error) {
      this.logger.error('Error during settings validation:', error);
      return false;
    }
  }

  /**
   * Validates scan results
   * @param scanResults The scan results to validate
   * @returns Boolean indicating if scan results are valid
   */
  validateScanResults(scanResults: any): boolean {
    try {
      this.logger.info('Validating scan results');
      
      if (!scanResults) {
        this.logger.error('Scan results are null or undefined');
        return false;
      }
      
      // Check required properties
      const requiredProps = ['id', 'url', 'timestamp', 'summary', 'issues', 'wcagLevel'];
      for (const prop of requiredProps) {
        if (!(prop in scanResults)) {
          this.logger.error(`Missing required property in scan results: ${prop}`);
          return false;
        }
      }
      
      // Validate specific properties
      if (typeof scanResults.id !== 'string' || scanResults.id.trim() === '') {
        this.logger.error('Invalid scan result ID');
        return false;
      }
      
      if (typeof scanResults.url !== 'string' || !scanResults.url.startsWith('http')) {
        this.logger.error('Invalid scan result URL');
        return false;
      }
      
      if (typeof scanResults.timestamp !== 'number' || scanResults.timestamp <= 0) {
        this.logger.error('Invalid scan result timestamp');
        return false;
      }
      
      // Validate summary structure
      if (!scanResults.summary || typeof scanResults.summary !== 'object') {
        this.logger.error('Invalid scan result summary');
        return false;
      }
      
      const summaryProps = ['total', 'critical', 'serious', 'moderate', 'minor'];
      for (const prop of summaryProps) {
        if (typeof scanResults.summary[prop] !== 'number' || scanResults.summary[prop] < 0) {
          this.logger.error(`Invalid scan result summary property: ${prop}`);
          return false;
        }
      }
      
      // Validate issues array
      if (!Array.isArray(scanResults.issues)) {
        this.logger.error('Scan result issues is not an array');
        return false;
      }
      
      // Validate WCAG level
      if (!['A', 'AA', 'AAA'].includes(scanResults.wcagLevel)) {
        this.logger.error(`Invalid WCAG level in scan results: ${scanResults.wcagLevel}`);
        return false;
      }
      
      this.logger.info('Scan results validation passed');
      return true;
    } catch (error) {
      this.logger.error('Error during scan results validation:', error);
      return false;
    }
  }
}