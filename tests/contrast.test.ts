import { ContrastChecker } from '../src/checkers/contrast';

describe('ContrastChecker', () => {
  it('returns an array of issues (smoke test)', async () => {
    document.body.innerHTML = `
      <button style="color:#777; background:#777">Low contrast</button>
      <p style="color:#000; background:#fff">Good contrast</p>
    `;

    const checker = new ContrastChecker();
    const issues = await checker.check();

    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });
});