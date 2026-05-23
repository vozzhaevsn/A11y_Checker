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
    expect((await checker.check()).length).toBe(0);
  });

  it.each([
    ['empty alt (decorative)', '<img src="decorative.png" alt="">'],
    ['role="presentation"', '<img src="bg.png" role="presentation">'],
    ['aria-hidden="true"', '<img src="bg.png" aria-hidden="true">'],
    ['display:none (hidden)', '<img src="test.png" style="display:none">'],
    ['no images on page', '<p>No images here</p>'],
  ])('produces no issues for %s', async (_, html) => {
    document.body.innerHTML = html;
    expect((await checker.check()).length).toBe(0);
  });

  it.each([
    ['generic alt text', '<img src="logo.png" alt="image">', 'suspicious'],
    ['filename as alt', '<img src="photo.png" alt="photo.jpg">', undefined],
  ])('flags images with %s', async (_, html, descContains) => {
    document.body.innerHTML = html;
    const issues = await checker.check();
    expect(issues.length).toBe(1);
    if (descContains) expect(issues[0]!.description).toContain(descContains);
  });
});
