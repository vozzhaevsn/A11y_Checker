import { ContrastChecker } from '../src/checkers/contrast';

describe('ContrastChecker', () => {
  let checker: ContrastChecker;

  beforeEach(() => {
    checker = new ContrastChecker();
  });

  describe('check()', () => {
    it('detects low contrast text', async () => {
      document.body.innerHTML = `<p style="color:#777777;background-color:#888888;">Low</p>`;
      const issues = await checker.check();
      expect(issues.length).toBeGreaterThanOrEqual(1);
      expect(issues[0]!.impact).toBeDefined();
    });

    it('passes high contrast text and skips hidden elements', async () => {
      document.body.innerHTML = `
        <p id="hc" style="color:#000;background-color:#fff;">OK</p>
        <p style="display:none;color:#777;background:#888;">Hidden</p>
      `;
      const issues = await checker.check();
      expect(issues.filter((i) => i.element.id === 'hc').length).toBe(0);
      expect(issues.filter((i) => i.element.tagName === 'p' && !i.element.id).length).toBe(0);
    });

    it('returns empty array for empty page', async () => {
      document.body.innerHTML = '';
      expect(await checker.check()).toEqual([]);
    });
  });

  describe('parseColor()', () => {
    it('parses hex, rgb, rgba and returns black for unknown', () => {
      expect(checker.parseColor('#ff0000')).toEqual([255, 0, 0, 1]);
      expect(checker.parseColor('#00ff00')).toEqual([0, 255, 0, 1]);
      expect(checker.parseColor('#fff')).toEqual([255, 255, 255, 1]);
      expect(checker.parseColor('rgb(255, 0, 0)')).toEqual([255, 0, 0, 1]);
      expect(checker.parseColor('rgba(0, 128, 255, 0.5)')).toEqual([0, 128, 255, 0.5]);
      expect(checker.parseColor('unknown')).toEqual([0, 0, 0, 1]);
    });
  });

  describe('relativeLuminance() and calculateContrastRatio()', () => {
    it('computes white/black luminance and contrast ratios', () => {
      expect(checker.relativeLuminance([255, 255, 255, 1])).toBeCloseTo(1.0, 2);
      expect(checker.relativeLuminance([0, 0, 0, 1])).toBeCloseTo(0.0, 2);
      expect(checker.calculateContrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21.0, 0);
      expect(checker.calculateContrastRatio([128, 128, 128, 1], [128, 128, 128, 1])).toBeCloseTo(1.0, 1);
    });
  });
});
