import { ImageChecker } from '../src/checkers/images';

describe('ImageChecker', () => {
  let checker: ImageChecker;

  beforeEach(() => {
    checker = new ImageChecker();
  });

  it('detects images without alt attribute', async () => {
    document.body.innerHTML = '<img src="test.png">';

    const issues = await checker.check();
    expect(issues.length).toBe(1);
    expect(issues[0]!.description).toContain('missing alt');
    expect(issues[0]!.impact).toBe('critical');
  });

  it('passes images with descriptive alt text', async () => {
    document.body.innerHTML = '<img src="test.png" alt="A photo of a sunset">';

    const issues = await checker.check();
    expect(issues.length).toBe(0);
  });

  it('passes explicitly decorative images with empty alt', async () => {
    document.body.innerHTML = '<img src="decorative.png" alt="">';

    const issues = await checker.check();
    expect(issues.length).toBe(0);
  });

  it('passes images with role="presentation"', async () => {
    document.body.innerHTML = '<img src="bg.png" role="presentation">';

    const issues = await checker.check();
    expect(issues.length).toBe(0);
  });

  it('passes images with aria-hidden="true"', async () => {
    document.body.innerHTML = '<img src="bg.png" aria-hidden="true">';

    const issues = await checker.check();
    expect(issues.length).toBe(0);
  });

  it('flags images with generic alt text', async () => {
    document.body.innerHTML = '<img src="logo.png" alt="image">';

    const issues = await checker.check();
    expect(issues.length).toBe(1);
    expect(issues[0]!.description).toContain('suspicious');
  });

  it('flags images with filename as alt text', async () => {
    document.body.innerHTML = '<img src="photo.png" alt="photo.jpg">';

    const issues = await checker.check();
    expect(issues.length).toBe(1);
  });

  it('returns empty for no images on page', async () => {
    document.body.innerHTML = '<p>No images here</p>';

    const issues = await checker.check();
    expect(issues.length).toBe(0);
  });

  it('skips hidden images', async () => {
    document.body.innerHTML = '<img src="test.png" style="display:none">';

    const issues = await checker.check();
    expect(issues.length).toBe(0);
  });
});
