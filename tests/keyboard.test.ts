import { KeyboardChecker } from '../src/checkers/keyboard';

describe('KeyboardChecker', () => {
  let checker: KeyboardChecker;

  beforeEach(() => {
    checker = new KeyboardChecker();
  });

  it('returns issues for elements with onclick but no tabindex', async () => {
    document.body.innerHTML = '<div onclick="alert(1)">Clickable div</div>';

    const issues = await checker.check();
    const kbIssues = issues.filter((i) => i.description.includes('not keyboard accessible'));
    expect(kbIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('flags positive tabindex', async () => {
    document.body.innerHTML = '<button tabindex="5">Bad tabindex</button>';

    const issues = await checker.check();
    const tabIssues = issues.filter((i) => i.description.includes('tabindex'));
    expect(tabIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('passes semantic button elements', async () => {
    document.body.innerHTML = '<button>OK</button>';

    const issues = await checker.check();
    const btnIssues = issues.filter(
      (i) => i.element.tagName === 'button' && i.description.includes('not keyboard accessible'),
    );
    expect(btnIssues.length).toBe(0);
  });

  it('passes elements with tabindex="0"', async () => {
    document.body.innerHTML = '<div tabindex="0" role="button">Custom button</div>';

    const issues = await checker.check();
    const kbIssues = issues.filter((i) => i.description.includes('not keyboard accessible'));
    expect(kbIssues.length).toBe(0);
  });

  it('returns empty array for page with no interactive elements', async () => {
    document.body.innerHTML = '<p>Static content</p>';

    const issues = await checker.check();
    expect(issues.length).toBe(0);
  });
});
