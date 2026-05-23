# Stage 4 — Performance Improvements Design

## Overview

4 independent tasks to improve performance and UX for scans with many issues, SPA pages, and iterative debugging.

## T-401: Issue Pagination

**Goal:** Popup stays usable when scan produces 50+ issues.

**Implementation:**
- Page size: 20 items (grouped cards)
- State: `currentPage` (1-based), `totalPages`
- Groups computed first (filter → group by selector → count), then sliced for current page
- Pagination controls: `<div id="pagination">` with Prev/Next + "Page X of Y"
- Hidden when totalPages ≤ 1
- HTML element added to `popup.html`; styles in `popup.css`
- 3 i18n strings: `paginationPrev`, `paginationNext`, `paginationPage(locale, current, total)`

**Files:** `popup.ts`, `popup.html`, `popup.css`, `messages.ts`

## T-402/403: Debounced DOM Watch (replaces Web Worker)

**Goal:** Auto-rescan when page content changes (SPA navigation, dynamic content).

**Why not Web Worker:** axe-core requires DOM access (`axe.run()` takes a DOM element). `runPartial()/finishRun()` split doesn't move the expensive DOM traversal off the main thread. ROI too low.

**Implementation:**
- New setting: `watchDomChanges: boolean` (default `false`)
- In `content-script.ts`: `MutationObserver` on `document.body` for `childList` + `subtree`
- 2-second debounce timer reset on each mutation batch
- Ignores mutations from own highlights (`data-a11y-highlight`)
- Max 5 automatic rescans per page load (prevents infinite loops on animating pages)
- Observer disconnects on `beforeunload`
- Scan-in-progress guard: skip if already scanning

**Files:** `content-script.ts`, `types/accessibility.ts`, `settings-defaults.ts`, `popup.ts`, `popup.html`, `messages.ts`

## T-404: Bundle Optimization (Dynamic Import)

**Goal:** Content script initializes fast; axe-core loads only on scan.

**Implementation:**
- Replace static `import axe from 'axe-core'` in `axe-engine.ts` with dynamic `import('axe-core')`
- `AxeEngine.scan()` becomes async with lazy import + caching
- `webpack.config.js`: set `splitChunks.chunks: 'async'` instead of disabling entirely
- Result: content-script.js ~20KB, axe-core chunk ~660KB loads on demand
- Fallback: if dynamic import fails in content script context, keep static import

**Files:** `axe-engine.ts`, `webpack.config.js`

## T-405: Scan Diff

**Goal:** Show what changed between two scans of the same URL.

**Implementation:**
- "Diff" button in History tab next to scans of the same URL (at least 2 entries)
- Matching key: `buildSelector(issue)` + first `wcagCriteria`
- Categories: New (present only in current), Fixed (present only in previous), Unchanged (both)
- Summary header: "3 new, 5 fixed, 12 unchanged" with color legend
- Color: green left-border for fixed, red for new, none for unchanged
- Diff runs in popup.ts (no background changes needed — both results already in storage)

**Files:** `popup.ts`, `popup.html`, `popup.css`, `messages.ts`

## Order & Dependencies

All 4 tasks are independent. Recommended order:
1. T-404 (bundle split) — lowest risk, enables cleaner imports
2. T-401 (pagination) — immediate UX win
3. T-405 (scan diff) — useful for debugging workflow
4. T-402 (DOM watch) — most new logic, depends on T-404 for lazy loading

## Testing

- T-401: test pagination slicing, edge case (exact page boundary, single page)
- T-402: test observer lifecycle, debounce, max-rescan limit
- T-404: verify build output has separate axe chunk, scan still works
- T-405: test diff matching with identical/different selectors, empty diffs
