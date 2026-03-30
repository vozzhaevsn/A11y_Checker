import axe from 'axe-core';
import type { RunOptions, AxeResults } from 'axe-core';
import { AxeCoreResult, Settings } from '../types';
import { Logger } from '../utils/logger';

export class AxeEngine {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('AxeEngine');
  }

  async scan(settings: Settings): Promise<AxeCoreResult> {
    try {
      this.logger.info('Starting axe-core scan');

      const config = this.getConfig(settings.wcagLevel);

      const results: AxeResults = await axe.run(document, config);

      this.logger.info(
        `Axe scan completed. Found ${results.violations.length} violations, ` +
          `${results.passes.length} passes, ${results.incomplete.length} incomplete`,
      );

      return {
        violations: results.violations as unknown as AxeCoreResult['violations'],
        passes: results.passes as unknown as AxeCoreResult['passes'],
        incomplete: results.incomplete as unknown as AxeCoreResult['incomplete'],
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };
    } catch (error) {
      this.logger.error('Error during axe-core scan:', error);
      throw error;
    }
  }

  private getConfig(wcagLevel: 'A' | 'AA' | 'AAA' = 'AA'): RunOptions {
    let tags: string[];

    switch (wcagLevel) {
      case 'A':
        tags = ['wcag2a', 'wcag21a'];
        break;
      case 'AAA':
        tags = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa'];
        break;
      default:
        tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
    }

    return {
      runOnly: {
        type: 'tag',
        values: tags,
      },
      resultTypes: ['violations', 'passes', 'incomplete'],
    };
  }

  reset(): void {
    axe.reset();
    this.logger.info('Axe engine reset to default configuration');
  }
}
