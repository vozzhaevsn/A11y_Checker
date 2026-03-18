import axe, { RunOptions } from 'axe-core';
import { AxeCoreResult, Settings } from '../types';
import { Logger } from '../utils/logger';

/**
 * Wrapper class for axe-core accessibility engine
 */
export class AxeEngine {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('AxeEngine');
  }

  /**
   * Runs axe-core accessibility scan on the current page
   * @param settings - User settings for scan configuration
   * @returns Promise resolving to AxeCoreResult
   */
  async scan(settings: Settings): Promise<AxeCoreResult> {
    try {
      this.logger.info('Starting axe-core scan');

      // Configure axe-core with appropriate WCAG standards
      const config = this.getConfig(settings.wcagLevel);

      // Run the analysis
      const results = await new Promise<any>((resolve, reject) => {
        axe.run(document, config, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });

      this.logger.info(
        `Axe scan completed. Found ${results.violations.length} violations, ` +
          `${results.passes.length} passes, ${results.incomplete.length} incomplete`,
      );

      const axeResult: AxeCoreResult = {
        violations: results.violations,
        passes: results.passes,
        incomplete: results.incomplete,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      return axeResult;
    } catch (error) {
      this.logger.error('Error during axe-core scan:', error);
      throw error;
    }
  }

  /**
   * Returns the axe-core configuration for the current settings
   */
  private getConfig(wcagLevel: 'A' | 'AA' | 'AAA' = 'AA'): RunOptions {
    let tags: string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

    if (wcagLevel === 'A') {
      tags = ['wcag2a', 'wcag21a'];
    } else if (wcagLevel === 'AA') {
      tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
    } else if (wcagLevel === 'AAA') {
      tags = [
        'wcag2a',
        'wcag2aa',
        'wcag2aaa',
        'wcag21a',
        'wcag21aa',
        'wcag21aaa',
      ];
    }

    return {
      runOnly: {
        type: 'tag',
        values: tags,
      },
      resultTypes: ['violations', 'passes', 'incomplete'],
    };
  }

  /**
   * Resets axe-core configuration to defaults
   */
  reset() {
    axe.reset();
    this.logger.info('Axe engine reset to default configuration');
  }
}
