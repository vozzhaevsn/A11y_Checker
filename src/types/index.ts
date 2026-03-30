export {
  Rectangle,
  ElementInfo,
  Settings,
  AccessibilityIssue,
  ContrastRatioResult,
  ImageAltResult,
  SemanticResult,
  KeyboardResult,
  AxeCoreResult,
  AxeViolation,
  AxeNode,
  ScanResult,
  StorageData,
} from './accessibility';

export interface Message {
  action: string;
  payload?: unknown;
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
