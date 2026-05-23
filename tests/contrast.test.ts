import { ContrastChecker } from '../src/checkers/contrast';

describe('ContrastChecker', () => {
  let checker: ContrastChecker;

  beforeEach(() => {
    checker = new ContrastChecker();
  });

  it('detects low contrast text', async () => {
    document.body.innerHTML = '<p style="color:#777777;background-color:#888888;">Low</p>';
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
