import axe from 'axe-core';
import { AxeEngine } from '../src/core/axe-engine';
import { Settings } from '../src/types';

jest.mock('axe-core');

const mockedAxe = axe as unknown as {
  run: jest.Mock;
  reset: jest.Mock;
};

describe('AxeEngine', () => {
  beforeEach(() => {
    mockedAxe.run = jest.fn((_doc, _config, cb) =>
      cb(null, {
        violations: [{ id: 'color-contrast', impact: 'serious' }],
        passes: [],
        incomplete: [],
      })
    );
    mockedAxe.reset = jest.fn();
  });

  it('runs axe-core with document and derived config', async () => {
    const engine = new AxeEngine();
    const settings: Settings = {
      wcagLevel: 'AA',
      includeColorContrast: true,
      includeImages: true,
      includeKeyboard: true,
      includeSemantics: true,
      autoScanOnLoad: false,
      theme: 'light',
    };

    const result = await engine.scan(settings);

    expect(mockedAxe.run).toHaveBeenCalledTimes(1);
    const [docArg, configArg] = mockedAxe.run.mock.calls[0];
    expect(docArg).toBe(document);
    expect(configArg.runOnly.values).toContain('wcag2aa');
    expect(result.violations).toHaveLength(1);
    expect(result.url).toBe(window.location.href);
  });

  it('uses WCAG A config when wcagLevel is A', async () => {
    const engine = new AxeEngine();
    await engine.scan({
      wcagLevel: 'A',
      includeColorContrast: true,
      includeImages: true,
      includeKeyboard: true,
      includeSemantics: true,
      autoScanOnLoad: false,
      theme: 'light',
    });

    const [, configArg] = mockedAxe.run.mock.calls[0];
    expect(configArg.runOnly.values).toEqual(expect.arrayContaining(['wcag2a', 'wcag21a']));
    expect(configArg.runOnly.values).not.toEqual(
      expect.arrayContaining(['wcag2aa', 'wcag21aa'])
    );
  });

  it('resets axe-core configuration', () => {
    const engine = new AxeEngine();
    engine.reset();
    expect(mockedAxe.reset).toHaveBeenCalledTimes(1);
  });
});