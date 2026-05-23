# Design: A11y Checker Pro — Stages 0–2

**Date:** 2026-05-23  
**Approach:** Sequential (A) — each stage fully complete before the next begins.

---

## Stage 0 — Stabilization

**Goal:** Stable, verified baseline. No new features.

### Changes

1. **`npm audit fix`** — patch 4 known vulnerabilities (brace-expansion moderate, fast-uri high, postcss moderate, ws moderate). All have non-breaking patches.

2. **`jest-environment-jsdom` downgrade** — `^30.3.0` → `^29.7.0` to match `jest@29.7.0`. Current mismatch passes tests but is semantically wrong and will break on stricter resolution.

3. **`.nvmrc`** — new file, value `22` (Node.js LTS). Signals recommended runtime without breaking Homebrew installs.

4. **`package.json` engines** — add `"engines": { "node": ">=18" }`. Prevents accidental runs on old Node.

5. **Documentation corrections** — PROGRESS.md and PRODUCT_SPEC.md: update test count to **83** (not 143), coverage to **86.1%** (not 88%+).

### Explicitly skipped
- Manual E2E on real sites — cannot automate in this session.
- `manifest.json` path audit — already verified correct (webpack outputs to `dist/src/...` matching manifest paths).

---

## Stage 1 — Quality & Reliability

**Goal:** CI pipeline, pre-commit guards, minor dep updates, implement two pending Settings features, DevTools coverage.

### 1.1 Dependency updates (safe minor/patch only)

| Package | From | To |
|---|---|---|
| `@typescript-eslint/eslint-plugin` | 8.57.2 | 8.59.4 |
| `@typescript-eslint/parser` | 8.57.2 | 8.59.4 |
| `ts-jest` | 29.4.6 | 29.4.11 |
| `ts-loader` | 9.5.4 | 9.5.7 |
| `webpack` | 5.105.4 | 5.107.1 |
| `html-webpack-plugin` | 5.6.6 | 5.6.7 |
| `webextension-polyfill` | 0.10.0 | 0.12.0 |

**Deferred (major/breaking):** jest 30, eslint 10, typescript 6, webpack-cli 7, @types/chrome 0.1.x.

### 1.2 GitHub Actions CI

File: `.github/workflows/ci.yml`

Three jobs on every push and PR to `main`:
- `lint` — `npm run lint`
- `test` — `npm test`
- `build` — `npm run build`

Cache: `~/.npm` keyed on `package-lock.json` hash. Node version: `22`.

### 1.3 Husky + lint-staged

- `husky` pre-commit hook runs `lint-staged`
- `lint-staged` runs `eslint --fix` on staged `*.ts` files only
- Does NOT run tests on pre-commit (too slow for extension)

### 1.4 Dark theme

`popup.css` currently has zero CSS variables. Strategy:
- Replace all hardcoded color values with CSS custom properties (`--color-bg`, `--color-text`, etc.)
- Default (`:root`) = light theme values
- `[data-theme="dark"]` on `<html>` overrides to dark values
- On popup init: read `settings.theme`, apply `data-theme` attribute
- Manual toggle in Settings modal updates `settings.theme` + `data-theme`
- `matchMedia('(prefers-color-scheme: dark)')` sets default if `settings.theme` not yet set

### 1.5 autoScanOnLoad

In `content-script.ts`, after settings are loaded from storage:
- If `settings.autoScanOnLoad === true`, call `performScan()` after `document.readyState === 'complete'`
- Add corresponding test in `tests/scanner.test.ts` or new `tests/content-script.test.ts`

### 1.6 DevTools panel tests

New file: `tests/devtools-panel.test.ts`
- Remove `devtools-panel.ts` exclusion from `collectCoverageFrom` in `jest.config.js`
- Test: panel initialization, message handling, render
- Target coverage: ≥70% for devtools-panel

---

## Stage 2 — UX Improvements

**Goal:** Daily-use ergonomics for developers.

### 2.1 Extension badge (T-205)

In `background.ts`, after storing a scan result:
- `chrome.action.setBadgeText({ text: String(criticalCount), tabId })`
- `chrome.action.setBadgeBackgroundColor`: red (`#d93025`) if critical > 0, orange (`#f29900`) if serious > 0, clear otherwise
- Clear badge when tab navigates away

### 2.2 Scan history tab (T-201)

In `popup.html/ts`:
- Add second tab "History" next to "Issues"
- Show last 10 scan results from `chrome.storage.local` (already stored, max 50)
- Each entry: favicon + URL (truncated) + timestamp (relative: "2h ago") + issue count badge
- Click on entry: load that result into the Issues tab

Storage: no schema change needed — `scanResults[]` already persists up to 50.

### 2.3 WCAG criterion filter (T-203)

In `popup.ts`:
- Add `<select>` dropdown populated with unique `wcagCriteria` values from current scan result
- Filter `issues` array client-side (no re-scan)
- Combine with existing severity filter (AND logic)

### 2.4 Group issues by element (T-204)

Change render logic in `popup.ts`:
- Group `issues` by `element.selector`
- Render: element header (tag + selector) → nested list of violations
- Reduces visual clutter when one element has 3+ issues

### 2.5 Copy CSS selector (T-206)

- Add "Copy" icon button on each issue card
- `navigator.clipboard.writeText(issue.element.selector)`
- Visual feedback: button text changes to "Copied!" for 1.5s

### 2.6 WCAG tooltip on hover (from ROADMAP, missing in TASKS)

- On each `wcagCriteria` chip/tag in the issue card: `title` attribute with short description
- Descriptions stored in i18n (`messages.ts`) — no external fetch
- Pure HTML `title` attribute (no JS tooltip library needed)

### 2.7 Scan diff (T-202) — DEFERRED to Stage 4

Requires non-trivial storage schema change and comparison logic. Not a UX task.

---

## Testing strategy

- All new logic gets unit tests (jsdom environment, chrome mock already in place)
- Dark theme: test that `data-theme` attribute is set correctly on init
- autoScanOnLoad: test that scan fires when flag is true, does not fire when false
- Badge: test that `setBadgeText` is called with correct value
- History tab: test render from stored results
- Coverage target after Stage 1: **≥90%**

---

## Commit sequence

```
chore: fix jest-environment-jsdom version, add .nvmrc, engines, audit fix  ← Stage 0
chore: update minor deps, add CI workflow, husky pre-commit                ← Stage 1a
feat: dark theme with CSS variables and manual toggle                      ← Stage 1b
feat: autoScanOnLoad in content script                                     ← Stage 1c
test: devtools-panel coverage                                              ← Stage 1d
feat: extension badge with critical issue count                            ← Stage 2a
feat: scan history tab in popup                                            ← Stage 2b
feat: WCAG criterion filter and issue grouping by element                  ← Stage 2c
feat: copy CSS selector button and WCAG tooltips                           ← Stage 2d
```
