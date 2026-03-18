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

const mockAxeEngine = AxeEngine as jest.MockedClass<typeof AxeEngine>;
const mockContrastChecker = ContrastChecker as jest.MockedClass<typeof ContrastChecker>;
const mockImageChecker = ImageChecker as jest.MockedClass<typeof ImageChecker>;
const mockSemanticChecker = SemanticChecker as jest.MockedClass<typeof SemanticChecker>;
const mockKeyboardChecker = KeyboardChecker as jest.MockedClass<typeof KeyboardChecker>;

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

  beforeEach(() => {
    jest.resetAllMocks();

    mockAxeEngine.prototype.scan = jest.fn().mockResolvedValue({
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
    } as AxeCoreResult);

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

    mockContrastChecker.prototype.check = jest
      .fn()
      .mockResolvedValue<AccessibilityIssue[]>([fakeIssue]);
    mockImageChecker.prototype.check = jest
      .fn()
      .mockResolvedValue<AccessibilityIssue[]>([]);
    mockSemanticChecker.prototype.check = jest
      .fn()
      .mockResolvedValue<AccessibilityIssue[]>([]);
    mockKeyboardChecker.prototype.check = jest
      .fn()
      .mockResolvedValue<AccessibilityIssue[]>([]);
  });

  it('scans page and returns combined issues with summary', async () => {
    const scanner = new Scanner(baseSettings);
    const result = await scanner.scanPage('https://example.com');

    expect(mockAxeEngine.prototype.scan).toHaveBeenCalledTimes(1);

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

    expect(mockAxeEngine.prototype.scan).toHaveBeenCalledTimes(1);

    expect(mockContrastChecker.prototype.check).not.toHaveBeenCalled();
    expect(mockImageChecker.prototype.check).not.toHaveBeenCalled();
    expect(mockSemanticChecker.prototype.check).not.toHaveBeenCalled();
    expect(mockKeyboardChecker.prototype.check).not.toHaveBeenCalled();

    expect(result.issues.length).toBe(1);
    expect(result.summary.total).toBe(1);
  });
});