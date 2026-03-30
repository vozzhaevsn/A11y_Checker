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
- Popup UI:
  - Summary cards (total, critical, serious, moderate, minor)
  - Scrollable issue list with color-coded severity badges
  - Issue filtering by severity level
  - WCAG level selector (A / AA / AAA)
  - Settings modal for toggling checker categories
  - Element highlighting on click
  - Export buttons (JSON, HTML, CSV)
  - Clear results button
- Background service worker:
  - Message routing between popup, content script, DevTools
  - `chrome.storage.local` persistence (last 50 scans)
  - Context menu integration
- DevTools panel with scan/export/clear
- Export utilities: JSON (pretty-printed), HTML (styled report), CSV
- Storage utility with CRUD operations and 50-result limit
- Logger with context prefixes and debug toggle
- Validator for WCAG compliance, settings, and scan results
- Test suite: 78 tests, 88%+ coverage (Jest + ts-jest + jsdom)
- Documentation: README, INSTALLATION, API, CHANGELOG
