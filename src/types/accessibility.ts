import type { ElementInfo } from './index';

/**
 * Accessibility-specific types
 */

export interface Settings {
  wcagLevel: 'A' | 'AA' | 'AAA';
  includeColorContrast: boolean;
  includeImages: boolean;
  includeKeyboard: boolean;
  includeSemantics: boolean;
  autoScanOnLoad: boolean;
  theme: 'light' | 'dark';
}

export interface AccessibilityIssue {
  id: string;
  element: ElementInfo;
  description: string;
  help: string;
  helpUrl: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  tags: string[];
  wcagLevels: ('A' | 'AA' | 'AAA')[];
  wcagCriteria: string[];
  fixSuggestions: string[];
}

export interface ContrastRatioResult {
  ratio: number;
  isValid: boolean;
  requiredRatio: number;
  foregroundColor: string;
  backgroundColor: string;
  element: ElementInfo;
}

export interface ImageAltResult {
  element: ElementInfo;
  hasAlt: boolean;
  altValue: string;
  isDecorative: boolean;
  isValid: boolean;
}

export interface SemanticResult {
  element: ElementInfo;
  isValid: boolean;
  issues: string[];
}

export interface KeyboardResult {
  element: ElementInfo;
  hasFocusIndicator: boolean;
  isKeyboardAccessible: boolean;
  tabIndexValid: boolean;
  isValid: boolean;
}

export interface AxeCoreResult {
  violations: any[];
  passes: any[];
  incomplete: any[];
  timestamp: string;
  url: string;
}
