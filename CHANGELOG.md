# Changelog

## [1.0.0] — 2026-03-30

### Added

- Chrome Extension Manifest V3 architecture
- axe-core 4.8+ integration with WCAG A / AA / AAA tag filtering
- Custom checkers:
  - **ContrastChecker** — WCAG 1.4.3 color contrast with ancestor background traversal
  - **ImageChecker** — WCAG 1.1.1 alt text validation, generic alt detection
  - **SemanticChecker** — page title, heading hierarchy, landmarks, form labels
  - **KeyboardChecker** — keyboard accessibility, focus indicators, tabindex validation
- Popup UI with summary cards, issue list, severity filters, WCAG level selector
- Background service worker with message routing and `chrome.storage.local` persistence
- DevTools panel with scan/export/clear
- Export utilities: JSON (pretty-printed), HTML (styled report), CSV
- Storage utility with CRUD operations and 50-result limit
- Logger with context prefixes and debug toggle
- Validator for WCAG compliance, settings, and scan results
- Test suite: 78 tests, 88%+ coverage (Jest + ts-jest + jsdom)
- Documentation: README, INSTALLATION, API, CHANGELOG

## [1.1.0] — 2026-05-23

### Stage 0 — Stabilization

- **Fixed:** jest-environment-jsdom pinned to 29.7.0 (match jest 29)
- **Fixed:** npm audit vulnerabilities (brace-expansion, fast-uri, postcss, ws)
- **Added:** `.nvmrc` (Node 22) and `engines` field in `package.json`
- **Fixed:** Documentation — corrected test count and coverage numbers
- **Chore:** Updated minor/patch dependencies (@typescript-eslint, ts-jest, ts-loader, webpack, webextension-polyfill, html-webpack-plugin)

### Stage 1 — Quality & Reliability

- **Added:** GitHub Actions CI workflow (lint, test, build on push/PR to main, Node 22)
- **Added:** Husky + lint-staged pre-commit hook (eslint --fix on staged *.ts)
- **Added:** Dark theme with CSS custom properties and manual toggle
- **Added:** `autoScanOnLoad` — content script auto-scans when setting is enabled

### Stage 2 — UX Improvements

- **Added:** Extension badge — red/orange/green on icon with critical/serious count
- **Added:** Scan history tab — last 10 URLs with relative timestamps and badge
- **Added:** WCAG criterion filter — dropdown populated from current scan results
- **Added:** Issue grouping by element CSS selector
- **Added:** Copy CSS selector button with "Copied!" visual feedback
- **Added:** WCAG criterion chips with hover tooltips
- **Added:** `getAllScans` message action in background

### Testing

- **Added:** DevTools panel tests (349 lines, removed from coverage exclusion)
- **Fixed:** Content-script test mock configuration (before module import)
- **Fixed:** Background test listener capture (before clearAllMocks)
- **Fixed:** `resetAllMocks` in devtools-panel tests for proper mock isolation
- **Consolidated:** Test suites — extracted helpers, removed redundant tests, used `it.each`

### Removed

- **Removed:** Dead `StorageUtil` class (background.ts uses direct `chrome.storage.local` with single `a11yCheckerData` key)

## [1.2.0] — 2026-05-23

### Stage 3 — Expanded Checks

- **Added:** Page language check (`<html lang="">`) — WCAG 3.1.1 (A)
- **Added:** Skip-link detection — WCAG 2.4.1 (A)
- **Added:** Reduced-motion media query check — WCAG 2.3.3 (AAA)
- **Added:** ARIA attribute validation (`aria-label`, `aria-labelledby`) — WCAG 4.1.2 (A)
- **Improved:** tabindex > 0 anti-pattern detection in KeyboardChecker
- **Updated:** axe-core 4.8.0 → 4.11.4

### Stage 4 — Performance

- **Added:** Issue pagination (20 groups per page, prev/next navigation)
- **Added:** Debounced DOM watch — auto-rescan on DOM changes (2s debounce, max 5 scans)
- **Added:** Scan diff — compare current result with previous scan of same URL (new/fixed/unchanged)
- **Optimized:** Lazy axe-core loading via dynamic import — content-script.js 678KB → 122KB (82% reduction)

### Testing

- **Added:** 13 new SemanticChecker tests for Stage 3 checks (lang, skip-links, reduced-motion, ARIA)
- **Total:** 106 tests, 13 suites
