import { SemanticChecker } from '../src/checkers/semantic';

describe('SemanticChecker', () => {
  let checker: SemanticChecker;

  beforeEach(() => {
    checker = new SemanticChecker();
  });

  it('detects missing page title', async () => {
    Object.defineProperty(document, 'title', { value: '', writable: true, configurable: true });
    document.body.innerHTML = '<h1>Test</h1><main>Content</main><header>H</header><nav>N</nav>';

    const issues = await checker.check();
    const titleIssues = issues.filter((i) => i.description.includes('title'));
    expect(titleIssues.length).toBe(1);
  });

  it('detects heading hierarchy skips', async () => {
    Object.defineProperty(document, 'title', { value: 'Test Page', writable: true, configurable: true });
    document.body.innerHTML = `
      <main><header></header><nav></nav>
      <h1>Title</h1>
      <h3>Skipped H2</h3>
      </main>
    `;

    const issues = await checker.check();
    const headingSkips = issues.filter((i) => i.description.includes('jumps'));
    expect(headingSkips.length).toBe(1);
  });

  it('detects missing H1', async () => {
    Object.defineProperty(document, 'title', { value: 'Test', writable: true, configurable: true });
    document.body.innerHTML = '<main><header></header><nav></nav><h2>Section</h2></main>';

    const issues = await checker.check();
    const h1Issues = issues.filter((i) => i.description.includes('H1'));
    expect(h1Issues.length).toBe(1);
  });

  it('detects missing landmarks', async () => {
    Object.defineProperty(document, 'title', { value: 'Test', writable: true, configurable: true });
    document.body.innerHTML = '<h1>Title</h1><p>No landmarks</p>';

    const issues = await checker.check();
    const landmarkIssues = issues.filter((i) => i.description.includes('landmark'));
    expect(landmarkIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('detects form inputs without labels', async () => {
    Object.defineProperty(document, 'title', { value: 'Test', writable: true, configurable: true });
    document.body.innerHTML = '<main><header></header><nav></nav><h1>T</h1><input type="text"></main>';

    const issues = await checker.check();
    const labelIssues = issues.filter((i) => i.description.includes('label'));
    expect(labelIssues.length).toBe(1);
  });

  it('passes inputs with for/id labels', async () => {
    Object.defineProperty(document, 'title', { value: 'Test', writable: true, configurable: true });
    document.body.innerHTML = `
      <main><header></header><nav></nav><h1>T</h1>
      <label for="name">Name</label>
      <input id="name" type="text">
      </main>
    `;

    const issues = await checker.check();
    const labelIssues = issues.filter((i) => i.description.includes('label'));
    expect(labelIssues.length).toBe(0);
  });

  it('passes inputs with aria-label', async () => {
    Object.defineProperty(document, 'title', { value: 'Test', writable: true, configurable: true });
    document.body.innerHTML = `
      <main><header></header><nav></nav><h1>T</h1>
      <input type="text" aria-label="Search">
      </main>
    `;

    const issues = await checker.check();
    const labelIssues = issues.filter((i) => i.description.includes('label'));
    expect(labelIssues.length).toBe(0);
  });
});
