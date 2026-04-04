export interface Rectangle {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ElementInfo {
  tagName: string;
  id?: string;
  className?: string;
  attributes: Record<string, string>;
  textContent?: string;
  position: Rectangle;
}

export interface Settings {
  wcagLevel: 'A' | 'AA' | 'AAA';
  /** UI, reports, and custom checker messages */
  locale: 'en' | 'ru';
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
  violations: AxeViolation[];
  passes: AxeViolation[];
  incomplete: AxeViolation[];
  timestamp: string;
  url: string;
}

export interface AxeViolation {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  impact: string;
  tags: string[];
  nodes: AxeNode[];
}

export interface AxeNode {
  target: string[];
  all: Record<string, unknown>;
  failureSummary?: string;
}

export interface ScanResult {
  id: string;
  url: string;
  timestamp: number;
  summary: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  issues: AccessibilityIssue[];
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface StorageData {
  scanResults: ScanResult[];
  settings: Settings;
  currentTabId: number | null;
}
