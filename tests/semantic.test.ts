import { SemanticChecker } from '../src/checkers/semantic';

describe('SemanticChecker', () => {
  let checker: SemanticChecker;

  const setTitle = (v: string) =>
    Object.defineProperty(document, 'title', { value: v, writable: true, configurable: true });

  beforeEach(() => {
    checker = new SemanticChecker();
    document.documentElement.setAttribute('lang', 'en');
  });

  it('detects missing page title', async () => {
    setTitle('');
    document.body.innerHTML = '<h1>Test</h1><main>Content</main><header>H</header><nav>N</nav>';
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('title')).length).toBe(1);
  });

  it('detects heading hierarchy skips (H1→H3)', async () => {
    setTitle('Test Page');
    document.body.innerHTML = `<main><header></header><nav></nav><h1>Title</h1><h3>Skip</h3></main>`;
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('jumps')).length).toBe(1);
  });

  it('detects missing H1', async () => {
    setTitle('Test');
    document.body.innerHTML = '<main><header></header><nav></nav><h2>Section</h2></main>';
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('H1')).length).toBe(1);
  });

  it('detects missing landmarks', async () => {
    setTitle('Test');
    document.body.innerHTML = '<h1>Title</h1><p>No landmarks</p>';
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('landmark')).length).toBeGreaterThanOrEqual(1);
  });

  it('detects form inputs without labels', async () => {
    setTitle('Test');
    document.body.innerHTML = '<main><header></header><nav></nav><h1>T</h1><input type="text"></main>';
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('label')).length).toBe(1);
  });

  it.each([
    ['for/id association', `<label for="name">Name</label><input id="name" type="text">`],
    ['aria-label', `<input type="text" aria-label="Search">`],
  ])('passes inputs labelled by %s', async (_, inputHtml) => {
    setTitle('Test');
    document.body.innerHTML = `<main><header></header><nav></nav><h1>T</h1>${inputHtml}</main>`;
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('label')).length).toBe(0);
  });

  /* ---------- lang attribute ---------- */

  it.each([
    ['en', 'missing'],
    ['ru', 'отсутствует атрибут lang'],
  ])('detects missing html lang attribute (locale: %s)', async (locale, keyword) => {
    document.documentElement.removeAttribute('lang');
    setTitle('Test');
    document.body.innerHTML = '<main><header></header><nav></nav><h1>T</h1></main>';
    const issues = await checker.check(locale as 'en' | 'ru');
    const langIssues = issues.filter((i) => i.wcagCriteria.includes('3.1.1'));
    expect(langIssues.length).toBe(1);
    expect(langIssues[0].impact).toBe('serious');
  });

  it('detects empty html lang attribute', async () => {
    document.documentElement.setAttribute('lang', '');
    setTitle('Test');
    document.body.innerHTML = '<main><header></header><nav></nav><h1>T</h1></main>';
    const issues = await checker.check();
    const langIssues = issues.filter((i) => i.wcagCriteria.includes('3.1.1'));
    expect(langIssues.length).toBe(1);
  });

  it('passes when html has valid lang', async () => {
    document.documentElement.setAttribute('lang', 'en');
    setTitle('Test');
    document.body.innerHTML = '<main><header></header><nav></nav><h1>T</h1></main>';
    const issues = await checker.check();
    const langIssues = issues.filter((i) => i.wcagCriteria.includes('3.1.1'));
    expect(langIssues.length).toBe(0);
  });

  /* ---------- ARIA attributes ---------- */

  it('detects empty aria-label on interactive element', async () => {
    document.documentElement.setAttribute('lang', 'en');
    setTitle('Test');
    document.body.innerHTML = '<main><header></header><nav></nav><h1>T</h1><button aria-label="">Click</button></main>';
    const issues = await checker.check();
    const ariaIssues = issues.filter((i) => i.description.includes('empty aria-label'));
    expect(ariaIssues.length).toBe(1);
    expect(ariaIssues[0].wcagCriteria).toContain('4.1.2');
  });

  it('detects aria-labelledby referencing non-existent id', async () => {
    document.documentElement.setAttribute('lang', 'en');
    setTitle('Test');
    document.body.innerHTML = '<main><header></header><nav></nav><h1>T</h1><input aria-labelledby="missing-id"></main>';
    const issues = await checker.check();
    const ariaIssues = issues.filter((i) => i.wcagCriteria.includes('4.1.2'));
    expect(ariaIssues.length).toBeGreaterThanOrEqual(1);
  });

  /* ---------- skip-links ---------- */

  it('detects missing skip-link when page has navigation', async () => {
    document.documentElement.setAttribute('lang', 'en');
    setTitle('Test');
    document.body.innerHTML = '<nav><a href="/">Home</a></nav><main id="main"><h1>Content</h1></main>';
    const issues = await checker.check();
    const skipIssues = issues.filter((i) => i.wcagCriteria.includes('2.4.1'));
    expect(skipIssues.length).toBe(1);
    expect(skipIssues[0].impact).toBe('moderate');
  });

  it('passes when skip-link exists', async () => {
    document.documentElement.setAttribute('lang', 'en');
    setTitle('Test');
    document.body.innerHTML = '<a href="#main">Skip to content</a><nav><a href="/">Home</a></nav><main id="main"><h1>Content</h1></main>';
    const issues = await checker.check();
    const skipIssues = issues.filter((i) => i.wcagCriteria.includes('2.4.1'));
    expect(skipIssues.length).toBe(0);
  });

  it('does not flag skip-link when page has no navigation', async () => {
    document.documentElement.setAttribute('lang', 'en');
    setTitle('Test');
    document.body.innerHTML = '<main><h1>Simple Page</h1><p>Just text.</p></main>';
    const issues = await checker.check();
    const skipIssues = issues.filter((i) => i.wcagCriteria.includes('2.4.1'));
    expect(skipIssues.length).toBe(0);
  });

  /* ---------- prefers-reduced-motion ---------- */

  it('detects animations without prefers-reduced-motion', async () => {
    document.documentElement.setAttribute('lang', 'en');
    setTitle('Test');
    document.body.innerHTML = `
      <style>
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
      <main><h1>Page</h1><div class="spinner"></div></main>
    `;
    const issues = await checker.check();
    const motionIssues = issues.filter((i) => i.wcagCriteria.includes('2.3.3'));
    expect(motionIssues.length).toBe(1);
    expect(motionIssues[0].impact).toBe('minor');
  });

  it('passes when prefers-reduced-motion media query exists', async () => {
    document.documentElement.setAttribute('lang', 'en');
    setTitle('Test');
    document.body.innerHTML = `
      <style>
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .spinner { animation: none; }
        }
      </style>
      <main><h1>Page</h1><div class="spinner"></div></main>
    `;
    const issues = await checker.check();
    const motionIssues = issues.filter((i) => i.wcagCriteria.includes('2.3.3'));
    expect(motionIssues.length).toBe(0);
  });

  it('passes when page has no animations', async () => {
    document.documentElement.setAttribute('lang', 'en');
    setTitle('Test');
    document.body.innerHTML = '<main><h1>Static Page</h1><p>No animations here.</p></main>';
    const issues = await checker.check();
    const motionIssues = issues.filter((i) => i.wcagCriteria.includes('2.3.3'));
    expect(motionIssues.length).toBe(0);
  });

  it('passes valid aria-label on interactive element', async () => {
    document.documentElement.setAttribute('lang', 'en');
    setTitle('Test');
    document.body.innerHTML = '<main><header></header><nav></nav><h1>T</h1><button aria-label="Close dialog">X</button></main>';
    const issues = await checker.check();
    const ariaIssues = issues.filter((i) => i.wcagCriteria.includes('4.1.2'));
    expect(ariaIssues.length).toBe(0);
  });
});
