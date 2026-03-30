# API Reference

## Types

### `AccessibilityIssue`

Represents a single accessibility violation.

```typescript
interface AccessibilityIssue {
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
```

### `ScanResult`

Represents a complete scan result.

```typescript
interface ScanResult {
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
```

### `Settings`

Extension settings stored in `chrome.storage.local`.

```typescript
interface Settings {
  wcagLevel: 'A' | 'AA' | 'AAA';
  includeColorContrast: boolean;
  includeImages: boolean;
  includeKeyboard: boolean;
  includeSemantics: boolean;
  autoScanOnLoad: boolean;
  theme: 'light' | 'dark';
}
```

### `ElementInfo`

Metadata about a DOM element associated with an issue.

```typescript
interface ElementInfo {
  tagName: string;
  id?: string;
  className?: string;
  attributes: Record<string, string>;
  textContent?: string;
  position: Rectangle;
}
```

---

## Core Modules

### `Scanner` — `src/core/scanner.ts`

Orchestrates the full accessibility scan.

```typescript
class Scanner {
  constructor(settings: Settings);
  scanPage(url: string): Promise<ScanResult>;
}
```

- Runs `AxeEngine.scan()` for axe-core violations
- Runs enabled custom checkers (contrast, images, semantic, keyboard)
- Combines results and calculates summary statistics

### `AxeEngine` — `src/core/axe-engine.ts`

Wraps axe-core for WCAG-targeted scanning.

```typescript
class AxeEngine {
  scan(settings: Settings): Promise<AxeCoreResult>;
  reset(): void;
}
```

- Configures axe-core `runOnly` tags based on selected WCAG level
- Returns violations, passes, and incomplete results

### `Validator` — `src/core/validator.ts`

Validates data structures and WCAG compliance.

```typescript
class Validator {
  validateWcagCompliance(issues: AccessibilityIssue[], wcagLevel: 'A' | 'AA' | 'AAA'): boolean;
  validateSettings(settings: Settings): boolean;
  validateScanResults(scanResults: unknown): boolean;
}
```

---

## Checkers

All checkers implement:

```typescript
check(): Promise<AccessibilityIssue[]>
```

### `ContrastChecker` — `src/checkers/contrast.ts`

- Checks all visible text elements for WCAG 1.4.3 contrast ratios
- AA: 4.5:1 (normal text), 3:1 (large text ≥ 18px or ≥ 14px bold)
- Traverses ancestors to find effective background color

### `ImageChecker` — `src/checkers/images.ts`

- Checks `<img>` and `[role="img"]` elements for WCAG 1.1.1
- Detects missing alt, generic/suspicious alt text
- Respects decorative markers: `alt=""`, `role="presentation"`, `aria-hidden="true"`

### `SemanticChecker` — `src/checkers/semantic.ts`

- **Page title**: WCAG 2.4.2
- **Heading hierarchy**: detects skipped levels, missing H1, multiple H1
- **Landmarks**: checks for `<main>`, `<header>`, `<nav>`
- **Form labels**: WCAG 1.3.1, 3.3.2 — checks `<label>`, `aria-label`, `aria-labelledby`

### `KeyboardChecker` — `src/checkers/keyboard.ts`

- Detects elements with `onclick` but no `tabindex` (WCAG 2.1.1)
- Flags positive `tabindex` values
- Checks for visible focus indicators (outline)

---

## Utilities

### `ExportUtil` — `src/utils/export.ts`

```typescript
class ExportUtil {
  exportAsJson(result: ScanResult): string;
  exportAsHtml(result: ScanResult): string;
  exportAsCsv(result: ScanResult): string;
}
```

### `StorageUtil` — `src/utils/storage.ts`

```typescript
class StorageUtil {
  saveScanResult(result: ScanResult): Promise<void>;
  getAllScanResults(): Promise<ScanResult[]>;
  getScanResultById(id: string): Promise<ScanResult | null>;
  deleteScanResult(id: string): Promise<void>;
  clearAllScanResults(): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  getSettings(): Promise<Settings>;
}
```

### `Logger` — `src/utils/logger.ts`

```typescript
class Logger {
  constructor(context: string);
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  static enableDebug(): void;
}
```

---

## Message API

Communication between popup, content script, and background service worker uses `chrome.runtime.sendMessage`.

| Action | Direction | Payload | Response |
|--------|-----------|---------|----------|
| `scan` | popup → content script | — | `{ success, result: ScanResult }` |
| `saveScanResult` | content script → background | `ScanResult` | `{ success }` |
| `getLastScan` | popup → background | — | `{ success, result: ScanResult \| null }` |
| `getSettings` | any → background | — | `{ success, settings: Settings }` |
| `updateSettings` | popup → background | `Partial<Settings>` | `{ success }` |
| `clearResults` | popup → background | — | `{ success }` |
| `highlightElement` | popup → content script | `{ selector: string }` | `{ success }` |
| `removeHighlights` | popup → content script | — | `{ success }` |
| `devtoolsScan` | devtools → background → content script | `{ tabId }` | `{ success, result }` |
