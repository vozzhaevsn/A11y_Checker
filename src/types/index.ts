export * from './accessibility';

import type {
  AccessibilityIssue,
  Settings,
  ContrastRatioResult,
  ImageAltResult,
  SemanticResult,
  KeyboardResult,
  AxeCoreResult,
} from './accessibility';

/**
 * Common types used throughout the application
 */
export interface Message {
  action: string;
  payload?: any;
  tabId?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ElementInfo {
  tagName: string;
  id: string | undefined;
  className: string | undefined;
  attributes: { [key: string]: string };
  textContent: string | undefined;
  position: Rectangle;
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

// Явный реэкспорт типов из accessibility.ts (если хочешь использовать ../types как фасад)
export type {
  AccessibilityIssue,
  Settings,
  ContrastRatioResult,
  ImageAltResult,
  SemanticResult,
  KeyboardResult,
  AxeCoreResult,
};
