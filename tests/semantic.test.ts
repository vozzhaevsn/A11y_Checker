import { SemanticChecker } from '../src/checkers/semantic';

describe('SemanticChecker', () => {
  let checker: SemanticChecker;

  /** Page skeleton with required landmarks and H1 — used by most tests */
  const GOOD_PAGE = '<main><header></header><nav></nav><h1>T</h1></main>';

  /** Insert additional content into GOOD_PAGE before the closing </main> */
  function pageWith(content: string): string {
    return `<main><header></header><nav></nav><h1>T</h1>${content}</main>`;
  }

  /**
   * One-stop DOM setup: document title, body HTML, optional lang.
   * Pass `null` to remove lang, `''` for empty, a code for valid.
   */
  function setupPage(title: string, body: string, lang?: string | null): void {
    if (lang === null) {
      document.documentElement.removeAttribute('lang');
    } else if (lang !== undefined) {
      document.documentElement.setAttribute('lang', lang);
    }
    Object.defineProperty(document, 'title', { value: title, writable: true, configurable: true });
    document.body.innerHTML = body;
  }

  beforeEach(() => {
    checker = new SemanticChecker();
    document.documentElement.setAttribute('lang', 'en');
  });

  // -------------------------------------------------------------------------
  // Title & heading structure
  // -------------------------------------------------------------------------

  it('detects missing page title', async () => {
    setupPage('', GOOD_PAGE);
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('title')).length).toBe(1);
  });

  it('detects heading hierarchy skips (H1→H3)', async () => {
    setupPage('Test Page', '<main><header></header><nav></nav><h1>Title</h1><h3>Skip</h3></main>');
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('jumps')).length).toBe(1);
  });

  it('detects missing H1', async () => {
    setupPage('Test', '<main><header></header><nav></nav><h2>Section</h2></main>');
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('H1')).length).toBe(1);
  });

  it('detects missing landmarks', async () => {
    setupPage('Test', '<h1>Title</h1><p>No landmarks</p>');
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('landmark')).length).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  // Form labels
  // -------------------------------------------------------------------------

  it('detects form inputs without labels', async () => {
    setupPage('Test', pageWith('<input type="text">'));
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('label')).length).toBe(1);
  });

  it.each([
    ['for/id association', '<label for="name">Name</label><input id="name" type="text">'],
    ['aria-label', '<input type="text" aria-label="Search">'],
  ])('passes inputs labelled by %s', async (_, inputHtml) => {
    setupPage('Test', pageWith(inputHtml));
    const issues = await checker.check();
    expect(issues.filter((i) => i.description.includes('label')).length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // lang attribute (WCAG 3.1.1)
  // -------------------------------------------------------------------------

  it.each([
    ['en', 'missing'],
    ['ru', 'отсутствует атрибут lang'],
  ])('detects missing html lang (locale: %s)', async (locale, keyword) => {
    setupPage('Test', GOOD_PAGE, null);
    const issues = await checker.check(locale as 'en' | 'ru');
    const langIssues = issues.filter((i) => i.wcagCriteria.includes('3.1.1'));
    expect(langIssues.length).toBe(1);
    expect(langIssues[0].impact).toBe('serious');
  });

  it('detects empty html lang attribute', async () => {
    setupPage('Test', GOOD_PAGE, '');
    const issues = await checker.check();
    expect(issues.filter((i) => i.wcagCriteria.includes('3.1.1')).length).toBe(1);
  });

  it('passes when html has valid lang', async () => {
    setupPage('Test', GOOD_PAGE, 'en');
    const issues = await checker.check();
    expect(issues.filter((i) => i.wcagCriteria.includes('3.1.1')).length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // ARIA attributes (WCAG 4.1.2)
  // -------------------------------------------------------------------------

  it('detects empty aria-label on interactive element', async () => {
    setupPage('Test', pageWith('<button aria-label="">Click</button>'));
    const issues = await checker.check();
    const ariaIssues = issues.filter((i) => i.description.includes('empty aria-label'));
    expect(ariaIssues.length).toBe(1);
    expect(ariaIssues[0].wcagCriteria).toContain('4.1.2');
  });

  it('detects aria-labelledby referencing non-existent id', async () => {
    setupPage('Test', pageWith('<input aria-labelledby="missing-id">'));
    const issues = await checker.check();
    expect(issues.filter((i) => i.wcagCriteria.includes('4.1.2')).length).toBeGreaterThanOrEqual(1);
  });

  it('passes valid aria-label on interactive element', async () => {
    setupPage('Test', pageWith('<button aria-label="Close dialog">X</button>'));
    const issues = await checker.check();
    expect(issues.filter((i) => i.wcagCriteria.includes('4.1.2')).length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // skip-links (WCAG 2.4.1)
  // -------------------------------------------------------------------------

  it('detects missing skip-link when page has navigation', async () => {
    setupPage('Test', '<nav><a href="/">Home</a></nav><main id="main"><h1>Content</h1></main>');
    const issues = await checker.check();
    const skipIssues = issues.filter((i) => i.wcagCriteria.includes('2.4.1'));
    expect(skipIssues.length).toBe(1);
    expect(skipIssues[0].impact).toBe('moderate');
  });

  it('passes when skip-link exists', async () => {
    setupPage('Test', '<a href="#main">Skip to content</a><nav><a href="/">Home</a></nav><main id="main"><h1>Content</h1></main>');
    const issues = await checker.check();
    expect(issues.filter((i) => i.wcagCriteria.includes('2.4.1')).length).toBe(0);
  });

  it('does not flag skip-link when page has no navigation', async () => {
    setupPage('Test', '<main><h1>Simple Page</h1><p>Just text.</p></main>');
    const issues = await checker.check();
    expect(issues.filter((i) => i.wcagCriteria.includes('2.4.1')).length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // prefers-reduced-motion (WCAG 2.3.3)
  // -------------------------------------------------------------------------

  it('detects animations without prefers-reduced-motion', async () => {
    setupPage('Test', `
      <style>
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
      <main><h1>Page</h1><div class="spinner"></div></main>
    `);
    const issues = await checker.check();
    const motionIssues = issues.filter((i) => i.wcagCriteria.includes('2.3.3'));
    expect(motionIssues.length).toBe(1);
    expect(motionIssues[0].impact).toBe('minor');
  });

  it('passes when prefers-reduced-motion media query exists', async () => {
    setupPage('Test', `
      <style>
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .spinner { animation: none; }
        }
      </style>
      <main><h1>Page</h1><div class="spinner"></div></main>
    `);
    const issues = await checker.check();
    expect(issues.filter((i) => i.wcagCriteria.includes('2.3.3')).length).toBe(0);
  });

  it('passes when page has no animations', async () => {
    setupPage('Test', '<main><h1>Static Page</h1><p>No animations here.</p></main>');
    const issues = await checker.check();
    expect(issues.filter((i) => i.wcagCriteria.includes('2.3.3')).length).toBe(0);
  });
});
