import { Validator } from '../src/core/validator';
import { AccessibilityIssue, Settings } from '../src/types';

describe('Validator', () => {
  let validator: Validator;

  const makeIssue = (impact: AccessibilityIssue['impact']): AccessibilityIssue => ({
    id: 'test',
    element: { tagName: 'div', attributes: {}, position: { top: 0, right: 0, bottom: 0, left: 0 } },
    description: 'Test issue',
    help: 'Fix it',
    helpUrl: '',
    impact,
    tags: [],
    wcagLevels: ['A'],
    wcagCriteria: ['1.1.1'],
    fixSuggestions: [],
  });

  beforeEach(() => {
    validator = new Validator();
  });

  describe('validateWcagCompliance', () => {
    it('returns true for no issues', () => {
      expect(validator.validateWcagCompliance([], 'AA')).toBe(true);
    });

    it.each([
      ['critical', 'A'],
      ['serious', 'A'],
    ] as const)('returns false for %s issues at any level', (impact, level) => {
      expect(validator.validateWcagCompliance([makeIssue(impact)], level)).toBe(false);
    });

    it('returns false for moderate at AA but allows minor', () => {
      expect(validator.validateWcagCompliance([makeIssue('moderate')], 'AA')).toBe(false);
      expect(validator.validateWcagCompliance([makeIssue('minor')], 'AA')).toBe(true);
    });

    it('returns false for minor issues at AAA', () => {
      expect(validator.validateWcagCompliance([makeIssue('minor')], 'AAA')).toBe(false);
    });
  });

  describe('validateSettings', () => {
    it('validates correct settings', () => {
      const settings: Settings = {
        wcagLevel: 'AA',
        locale: 'en',
        includeColorContrast: true,
        includeImages: true,
        includeKeyboard: true,
        includeSemantics: true,
        autoScanOnLoad: false,
        watchDomChanges: false,
        theme: 'light',
      };
      expect(validator.validateSettings(settings)).toBe(true);
    });

    it('rejects null, invalid wcagLevel, invalid theme, invalid locale', () => {
      expect(validator.validateSettings(null as unknown as Settings)).toBe(false);
      expect(validator.validateSettings({ wcagLevel: 'X' as 'A', theme: 'light' } as Settings)).toBe(false);
      expect(validator.validateSettings({ wcagLevel: 'AA', theme: 'blue' as 'light' } as Settings)).toBe(false);
      expect(validator.validateSettings({ wcagLevel: 'AA', locale: 'fr' as 'en', theme: 'light' } as Settings)).toBe(false);
    });
  });

  describe('validateScanResults', () => {
    it('validates correct scan result', () => {
      const result = {
        id: 'scan_123',
        url: 'https://example.com',
        timestamp: Date.now(),
        summary: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
        issues: [],
        wcagLevel: 'AA',
      };
      expect(validator.validateScanResults(result)).toBe(true);
    });

    it('rejects null, missing properties, and non-array issues', () => {
      expect(validator.validateScanResults(null)).toBe(false);
      expect(validator.validateScanResults({ id: 'test' })).toBe(false);
      expect(validator.validateScanResults({
        id: 'test', url: 'https://example.com', timestamp: 123,
        summary: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
        issues: 'not-array', wcagLevel: 'AA',
      })).toBe(false);
    });
  });
});
