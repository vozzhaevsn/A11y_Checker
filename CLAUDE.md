# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Production build → dist/
npm run build:dev      # Development watch mode
npm test               # Run all tests with coverage
npm run test:watch     # Watch mode
npx jest tests/scanner.test.ts   # Run a single test file
npx jest -t "test name"          # Run tests matching a name pattern
npm run lint           # ESLint on src/
npm run clean          # Remove dist/
npm run zip            # Build + zip dist/ for Chrome Web Store submission
```

To load in Chrome: build first, then `chrome://extensions` → Developer mode → Load unpacked → select `dist/`.

Node ≥18 required. Use `.nvmrc` (value: `22`) with nvm.

## Architecture

**Chrome Extension MV3** with 5 webpack entry points compiled to `dist/src/scripts/` and `dist/src/ui/`. The `manifest.json` is copied as-is, so it references paths like `src/scripts/background.js` — these resolve correctly inside `dist/`.

### Message flow

```
popup.ts ──sendMessage──► background.ts (Service Worker)
                              │
                    ──sendMessage──► content-script.ts
                                          │
                                    Scanner.scanPage()
                                          │
                          ┌───────────────┴──────────────┐
                     AxeEngine                  4 custom checkers
                  (axe-core 4.11)        (contrast/images/semantic/keyboard)
                          │                               │
                          └───────────────┬───────────────┘
                                    ScanResult
                                          │
                              chrome.storage.local (key: a11yCheckerData)
                              { scanResults[], settings, currentTabId }
                              max 50 results
```

### Key modules

- **`src/core/scanner.ts`** — orchestrates all checks; `Scanner` takes `Settings`, calls checkers conditionally based on settings flags, merges results
- **`src/core/axe-engine.ts`** — wraps axe-core; filters rules by WCAG level (A/AA/AAA); uses a CSP-safe Russian locale (no eval/doT templates); lazy-loads axe-core via dynamic `import()` with module-level cache (`getAxe()`)
- **`src/checkers/`** — four custom checkers, each exports a class with `.check(locale)` returning `AccessibilityIssue[]`. `SemanticChecker` has the broadest scope with 8 checks: page title (2.4.2), headings (1.3.1), landmarks (1.3.1), form labels (1.3.1/3.3.2), page lang (3.1.1), skip-links (2.4.1), ARIA attributes (4.1.2), and reduced-motion (2.3.3)
- **`src/scripts/background.ts`** — Service Worker; routes messages; updates extension badge after each scan; enforces 50-result storage limit. Message actions: `saveScanResult`, `getLastScan`, `getSettings`, `updateSettings`, `clearResults`, `devtoolsScan`, `getAllScans`
- **`src/scripts/content-script.ts`** — injected into pages; handles `scan`, `highlightElement`, `removeHighlights` messages; auto-scan on load when enabled; DOM watch via MutationObserver (2s debounce, max 5 auto-scans, filters own highlights, beforeunload cleanup); scan-in-progress guard prevents overlapping auto-scans
- **`src/ui/popup.ts`** — popup UI controller; two tabs (Issues / History); dark theme toggle; WCAG level + criterion filters; issue grouping by CSS selector; copy-selector button; pagination (20 groups/page); scan diff (compare with previous scan of same URL, new/fixed/unchanged); DOM watch toggle in settings; reads all scans via `getAllScans` for history tab
- **`src/ui/devtools-panel.ts`** — DevTools panel UI; separate from popup but similar scan/render logic
- **`src/utils/settings-defaults.ts`** — default `Settings` object and merge helpers
- **`src/i18n/`** — all EN/RU strings; `axe-failure-summary.ts` localizes axe-core `failureSummary` strings without using eval; `messages.ts` contains `PopupUiStrings` interface used by both popup and devtools-panel; `checker-messages.ts` contains checker-specific description/help/fix strings (57 functions)

### Types

Core types live in `src/types/accessibility.ts`: `AccessibilityIssue`, `ScanResult`, `Settings`, `ElementInfo`, `Rectangle`. Import via `../types` (barrel in `src/types/index.ts`).

`Settings` fields: `wcagLevel` ('A'|'AA'|'AAA'), `locale` ('en'|'ru'), `includeColorContrast`, `includeImages`, `includeSemantics`, `includeKeyboard`, `autoScanOnLoad`, `watchDomChanges`, `theme` ('light'|'dark'). All fields are implemented.

### Dark theme

CSS custom properties (`--color-*`) are defined in `:root` and overridden in `[data-theme="dark"]` on `<html>`. `applyTheme(theme)` sets `document.documentElement.setAttribute('data-theme', ...)`. Theme persists via `settings.theme` in `chrome.storage.local`.

### Extension badge

After each scan, `background.ts` calls `chrome.action.setBadgeText/setBadgeBackgroundColor`. Red (`#d93025`) for critical > 0, orange (`#f29900`) for serious > 0, empty text otherwise. Badge is scoped to the sender tab when `tabId` is available.

### Testing

Tests are in `tests/` (13 suites, 106 tests), environment is jsdom. Chrome APIs are globally mocked in `tests/setup.ts` — every test file gets the mock automatically. `devtools.ts` is excluded from coverage collection; `devtools-panel.ts` is included.

**Pattern for modules with top-level IIFEs** (background, content-script, devtools-panel): capture the registered message listener in `beforeAll` before any `clearAllMocks()` can wipe it, configure mocks before `jest.resetModules()` + dynamic `import()`, and use `jest.resetAllMocks()` (not `clearAllMocks`) in `beforeEach` to prevent mock implementation leakage between tests.

**Test conventions:** Extract shared fixture constants (e.g. `BASE_SETTINGS`, `PANEL_HTML`) and factory helpers (e.g. `settingsMock(locale)`, `buildScanResult(overrides)`, `buildIssue(overrides)`) at the top of each test file. Use `it.each` for tests that assert the same behavior with trivially different inputs (locale variants, invalid-value rejections, pass/fail HTML variants). Merge assertions about the same setup into one `it` rather than splitting into separate tests.

### Bundle structure

`splitChunks` cache groups are disabled (each entry owns its dependencies). The exception is axe-core, which is lazy-loaded via dynamic `import()` in `axe-engine.ts` — it produces a separate `axe-core.[hash].js` chunk (563KB) loaded only on scan. Content script main bundle is 122KB.

### CI / pre-commit / release

- **CI:** GitHub Actions runs `lint → test → build` on every push/PR to `main` (`.github/workflows/ci.yml`, Node 22)
- **Pre-commit:** Husky runs `eslint --fix` on staged `src/**/*.ts` via lint-staged (`.lintstagedrc.json`)
- **Release:** push a `v*` tag → `.github/workflows/release.yml` runs lint → test → build → zip → GitHub Release with artifact attached. `npm run zip` does the same locally.
