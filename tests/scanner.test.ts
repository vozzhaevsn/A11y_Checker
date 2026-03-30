import { Scanner } from '../src/core/scanner';
import { AxeEngine } from '../src/core/axe-engine';
import { ContrastChecker } from '../src/checkers/contrast';
import { ImageChecker } from '../src/checkers/images';
import { SemanticChecker } from '../src/checkers/semantic';
import { KeyboardChecker } from '../src/checkers/keyboard';
import { Settings, AxeCoreResult, AccessibilityIssue } from '../src/types';

jest.mock('../src/core/axe-engine');
jest.mock('../src/checkers/contrast');
jest.mock('../src/checkers/images');
jest.mock('../src/checkers/semantic');
jest.mock('../src/checkers/keyboard');

const MockedAxeEngine = AxeEngine as jest.MockedClass<typeof AxeEngine>;
const MockedContrast = ContrastChecker as jest.MockedClass<typeof ContrastChecker>;
const MockedImage = ImageChecker as jest.MockedClass<typeof ImageChecker>;
const MockedSemantic = SemanticChecker as jest.MockedClass<typeof SemanticChecker>;
const MockedKeyboard = KeyboardChecker as jest.MockedClass<typeof KeyboardChecker>;

describe('Scanner', () => {
  const baseSettings: Settings = {
    wcagLevel: 'AA',
    includeColorContrast: true,
    includeImages: true,
    includeKeyboard: true,
    includeSemantics: true,
    autoScanOnLoad: false,
    theme: 'light',
  };

  const fakeAxeResult: AxeCoreResult = {
    violations: [
      {
        id: 'color-contrast',
        description: 'Insufficient color contrast',
        help: 'Fix colors',
        helpUrl: 'https://example.com',
        impact: 'serious',
        tags: ['wcag2aa', 'wcag143'],
        nodes: [
          {
            target: ['button.primary'],
            all: {},
            failureSummary: 'Fix color contrast',
          },
        ],
      },
    ],
    passes: [],
    incomplete: [],
    timestamp: new Date().toISOString(),
    url: 'https://example.com',
  };

  const fakeIssue: AccessibilityIssue = {
    id: 'custom-check-1',
    element: {
      tagName: 'button',
      attributes: {},
      position: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    description: 'Custom issue',
    help: 'Fix something',
    helpUrl: 'https://example.com',
    impact: 'moderate',
    tags: [],
    wcagLevels: ['AA'],
    wcagCriteria: ['2.4.7'],
    fixSuggestions: [],
  };

  beforeEach(() => {
    jest.resetAllMocks();

    MockedAxeEngine.prototype.scan = jest.fn().mockResolvedValue(fakeAxeResult);
    MockedContrast.prototype.check = jest.fn().mockResolvedValue([fakeIssue]);
    MockedImage.prototype.check = jest.fn().mockResolvedValue([]);
    MockedSemantic.prototype.check = jest.fn().mockResolvedValue([]);
    MockedKeyboard.prototype.check = jest.fn().mockResolvedValue([]);
  });

  it('scans page and returns combined issues with summary', async () => {
    const scanner = new Scanner(baseSettings);
    const result = await scanner.scanPage('https://example.com');

    expect(MockedAxeEngine.prototype.scan).toHaveBeenCalledTimes(1);
    expect(result.issues.length).toBe(2);
    expect(result.summary.total).toBe(2);
    expect(result.summary.serious).toBe(1);
    expect(result.summary.moderate).toBe(1);
    expect(result.summary.critical).toBe(0);
    expect(result.url).toBe('https://example.com');
    expect(result.wcagLevel).toBe('AA');
  });

  it('respects settings flags and can disable custom checkers', async () => {
    const scanner = new Scanner({
      ...baseSettings,
      includeColorContrast: false,
      includeImages: false,
      includeKeyboard: false,
      includeSemantics: false,
    });

    const result = await scanner.scanPage('https://example.com');

    expect(MockedContrast.prototype.check).not.toHaveBeenCalled();
    expect(MockedImage.prototype.check).not.toHaveBeenCalled();
    expect(MockedSemantic.prototype.check).not.toHaveBeenCalled();
    expect(MockedKeyboard.prototype.check).not.toHaveBeenCalled();

    expect(result.issues.length).toBe(1);
    expect(result.summary.total).toBe(1);
  });

  it('generates a unique scan ID', async () => {
    const scanner = new Scanner(baseSettings);
    const result1 = await scanner.scanPage('https://example.com');
    const result2 = await scanner.scanPage('https://example.com');

    expect(result1.id).not.toBe(result2.id);
    expect(result1.id).toMatch(/^scan_\d+_[a-z0-9]+$/);
  });

  it('passes the correct timestamp', async () => {
    const before = Date.now();
    const scanner = new Scanner(baseSettings);
    const result = await scanner.scanPage('https://example.com');
    const after = Date.now();

    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
  });

  it('propagates axe-core errors', async () => {
    MockedAxeEngine.prototype.scan = jest.fn().mockRejectedValue(new Error('axe failed'));
    const scanner = new Scanner(baseSettings);

    await expect(scanner.scanPage('https://example.com')).rejects.toThrow('axe failed');
  });
});
