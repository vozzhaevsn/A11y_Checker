import { ContrastChecker } from '../src/checkers/contrast';

describe('ContrastChecker', () => {
  let checker: ContrastChecker;

  beforeEach(() => {
    checker = new ContrastChecker();
  });

  describe('check()', () => {
    it('detects low contrast text', async () => {
      document.body.innerHTML = `
        <p style="color: #777777; background-color: #888888;">Low contrast</p>
      `;

      const issues = await checker.check();
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThanOrEqual(1);
      expect(issues[0]!.impact).toBeDefined();
    });

    it('passes high contrast text', async () => {
      document.body.innerHTML = `
        <p id="hc" style="color: #000000; background-color: #ffffff;">Good contrast</p>
      `;

      const issues = await checker.check();
      const hcIssues = issues.filter(i => i.element.id === 'hc');
      expect(hcIssues.length).toBe(0);
    });

    it('returns empty array for empty page', async () => {
      document.body.innerHTML = '';
      const issues = await checker.check();
      expect(issues).toEqual([]);
    });

    it('skips hidden elements', async () => {
      document.body.innerHTML = `
        <p style="display: none; color: #777; background: #888;">Hidden</p>
      `;

      const issues = await checker.check();
      expect(issues.length).toBe(0);
    });
  });

  describe('parseColor()', () => {
    it('parses hex colors', () => {
      expect(checker.parseColor('#ff0000')).toEqual([255, 0, 0, 1]);
      expect(checker.parseColor('#00ff00')).toEqual([0, 255, 0, 1]);
      expect(checker.parseColor('#fff')).toEqual([255, 255, 255, 1]);
    });

    it('parses rgb colors', () => {
      expect(checker.parseColor('rgb(255, 0, 0)')).toEqual([255, 0, 0, 1]);
      expect(checker.parseColor('rgba(0, 128, 255, 0.5)')).toEqual([0, 128, 255, 0.5]);
    });

    it('returns black for unknown format', () => {
      expect(checker.parseColor('unknown')).toEqual([0, 0, 0, 1]);
    });
  });

  describe('relativeLuminance()', () => {
    it('calculates luminance for white', () => {
      const lum = checker.relativeLuminance([255, 255, 255, 1]);
      expect(lum).toBeCloseTo(1.0, 2);
    });

    it('calculates luminance for black', () => {
      const lum = checker.relativeLuminance([0, 0, 0, 1]);
      expect(lum).toBeCloseTo(0.0, 2);
    });
  });

  describe('calculateContrastRatio()', () => {
    it('returns 21:1 for black on white', () => {
      const ratio = checker.calculateContrastRatio([0, 0, 0, 1], [255, 255, 255, 1]);
      expect(ratio).toBeCloseTo(21.0, 0);
    });

    it('returns 1:1 for same colors', () => {
      const ratio = checker.calculateContrastRatio([128, 128, 128, 1], [128, 128, 128, 1]);
      expect(ratio).toBeCloseTo(1.0, 1);
    });
  });
});
