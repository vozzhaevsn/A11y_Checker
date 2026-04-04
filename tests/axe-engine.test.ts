import axe from 'axe-core';
import { AxeEngine } from '../src/core/axe-engine';
import { Settings } from '../src/types';

jest.mock('axe-core', () => ({
  __esModule: true,
  default: {
    run: jest.fn(),
    reset: jest.fn(),
    configure: jest.fn(),
  },
}));

const mockedAxe = axe as unknown as {
  run: jest.Mock;
  reset: jest.Mock;
  configure: jest.Mock;
};

describe('AxeEngine', () => {
  const baseSettings: Settings = {
    wcagLevel: 'AA',
    locale: 'en',
    includeColorContrast: true,
    includeImages: true,
    includeKeyboard: true,
    includeSemantics: true,
    autoScanOnLoad: false,
    theme: 'light',
  };

  beforeEach(() => {
    mockedAxe.run.mockResolvedValue({
      violations: [{ id: 'color-contrast', impact: 'serious', nodes: [] }],
      passes: [],
      incomplete: [],
    });
    mockedAxe.reset.mockReturnValue(undefined);
    mockedAxe.configure.mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('runs axe-core with document and WCAG AA config', async () => {
    const engine = new AxeEngine();
    const result = await engine.scan(baseSettings);

    expect(mockedAxe.reset).toHaveBeenCalled();
    expect(mockedAxe.configure).not.toHaveBeenCalled();
    expect(mockedAxe.run).toHaveBeenCalledTimes(1);
    const [docArg, configArg] = mockedAxe.run.mock.calls[0];
    expect(docArg).toBe(document);
    expect(configArg.runOnly.values).toContain('wcag2aa');
    expect(configArg.runOnly.values).toContain('wcag2a');
    expect(result.violations).toHaveLength(1);
    expect(result.url).toBe(window.location.href);
  });

  it('uses WCAG A config when wcagLevel is A', async () => {
    const engine = new AxeEngine();
    await engine.scan({ ...baseSettings, wcagLevel: 'A' });

    const [, configArg] = mockedAxe.run.mock.calls[0];
    expect(configArg.runOnly.values).toContain('wcag2a');
    expect(configArg.runOnly.values).toContain('wcag21a');
    expect(configArg.runOnly.values).not.toContain('wcag2aa');
    expect(configArg.runOnly.values).not.toContain('wcag21aa');
  });

  it('uses WCAG AAA config when wcagLevel is AAA', async () => {
    const engine = new AxeEngine();
    await engine.scan({ ...baseSettings, wcagLevel: 'AAA' });

    const [, configArg] = mockedAxe.run.mock.calls[0];
    expect(configArg.runOnly.values).toContain('wcag2aaa');
    expect(configArg.runOnly.values).toContain('wcag21aaa');
  });

  it('resets axe-core configuration', () => {
    const engine = new AxeEngine();
    engine.reset();
    expect(mockedAxe.reset).toHaveBeenCalledTimes(1);
  });

  it('configures Russian locale when locale is ru', async () => {
    const engine = new AxeEngine();
    await engine.scan({ ...baseSettings, locale: 'ru' });

    expect(mockedAxe.configure).toHaveBeenCalledTimes(1);
    expect(mockedAxe.configure.mock.calls[0][0]).toMatchObject({ locale: expect.any(Object) });
  });

  it('throws when axe.run rejects', async () => {
    mockedAxe.run.mockRejectedValue(new Error('axe error'));
    const engine = new AxeEngine();

    await expect(engine.scan(baseSettings)).rejects.toThrow('axe error');
  });
});
