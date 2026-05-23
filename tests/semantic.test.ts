import { SemanticChecker } from '../src/checkers/semantic';

describe('SemanticChecker', () => {
  let checker: SemanticChecker;

  const setTitle = (v: string) =>
    Object.defineProperty(document, 'title', { value: v, writable: true, configurable: true });

  beforeEach(() => {
    checker = new SemanticChecker();
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
});
