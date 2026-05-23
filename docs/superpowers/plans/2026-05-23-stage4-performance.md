# Stage 4 — Performance Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve popup responsiveness (pagination, bundle split), add real-time DOM change detection, and enable scan diffs for iterative debugging.

**Architecture:** Four independent tasks: T-404 splits axe-core into a lazy chunk, T-401 adds page controls to the popup, T-405 adds diff comparison between scans, T-402 adds MutationObserver-based auto-rescan.

**Tech Stack:** TypeScript 5, Webpack 5, Chrome MV3, axe-core 4.11

---

## File Structure

| File | Role |
|------|------|
| `src/core/axe-engine.ts` | Modified: dynamic import axe-core |
| `src/types/accessibility.ts` | Modified: add `watchDomChanges` to Settings |
| `src/utils/settings-defaults.ts` | Modified: add `watchDomChanges` default |
| `src/scripts/content-script.ts` | Modified: MutationObserver for DOM watch |
| `src/ui/popup.ts` | Modified: pagination, diff, DOM watch settings |
| `src/ui/popup.html` | Modified: pagination controls, diff button, DOM watch checkbox |
| `src/ui/popup.css` | Modified: pagination, diff, and DOM watch styles |
| `src/i18n/messages.ts` | Modified: new UI strings |
| `webpack.config.js` | Modified: chunkFilename for dynamic chunks |

---

### Task 1: T-404 — Bundle Optimization (Dynamic Import)

**Files:**
- Modify: `src/core/axe-engine.ts:1-84`
- Modify: `webpack.config.js:15-18`

- [ ] **Step 1: Add chunkFilename to webpack output config**

In `webpack.config.js`, update the `output` block to add `chunkFilename`. Change lines 15-18:

```js
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: '[name].js',
  chunkFilename: 'src/scripts/[name].[contenthash:8].js',
  clean: true,
},
```

- [ ] **Step 2: Build to verify config**

Run: `npm run build`
Expected: Build succeeds. No chunk split yet (no dynamic imports).

- [ ] **Step 3: Change axe-engine.ts from static import to lazy import**

In `src/core/axe-engine.ts`, replace line 1 (`import axe from 'axe-core';`) and add lazy loading:

```typescript
// Remove: import axe from 'axe-core';
import type { AxeResults, Locale, RunOptions } from 'axe-core';
import ruLocale from 'axe-core/locales/ru.json';
import { AxeCoreResult, Settings } from '../types';
import { Logger } from '../utils/logger';

/* eslint-disable @typescript-eslint/no-explicit-any */
let axeInstance: any = null;

async function getAxe(): Promise<any> {
  if (!axeInstance) {
    axeInstance = (await import('axe-core' /* webpackChunkName: "axe-core" */)).default;
  }
  return axeInstance;
}
```

In the `scan` method, add `const axe = await getAxe();` at line 28 (after `this.logger.info(...)`):

```typescript
async scan(settings: Settings): Promise<AxeCoreResult> {
  try {
    this.logger.info('Starting axe-core scan');

    const axe = await getAxe();

    axe.reset();
    if (settings.locale === 'ru') {
      axe.configure({ locale: russianAxeLocaleSafeForCsp() });
    }

    const config = this.getConfig(settings.wcagLevel);
    const results: AxeResults = await axe.run(document, config);
    // ... rest unchanged
  }
}
```

The `reset()` method should also load axe:

```typescript
reset(): void {
  if (axeInstance) {
    axeInstance.reset();
    this.logger.info('Axe engine reset to default configuration');
  }
}
```

- [ ] **Step 4: Build and verify chunk split**

Run: `npm run build`
Expected: `dist/src/scripts/axe-core.[hash].js` appears alongside `dist/src/scripts/content-script.js`. Content script shrinks from ~678KB to ~20-30KB. Build succeeds.

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: 13 suites, 106 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/core/axe-engine.ts webpack.config.js
git commit -m "perf: lazy-load axe-core via dynamic import, split bundle

Content-script.js drops from 678KB to ~25KB. axe-core chunk (~660KB)
loads on-demand only when a scan is triggered.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: T-401 — Pagination of Issues List

**Files:**
- Modify: `src/ui/popup.ts` — pagination logic
- Modify: `src/ui/popup.html` — pagination container
- Modify: `src/ui/popup.css` — pagination styles
- Modify: `src/i18n/messages.ts` — pagination strings

- [ ] **Step 1: Add i18n strings for pagination**

In `src/i18n/messages.ts`, add to the `PopupUiStrings` interface (after line 44 `copySelector`):

```typescript
paginationPrev: string;
paginationNext: string;
paginationPage: (current: number, total: number) => string;
```

In `popupEn` (after line 131 `copiedSelector`):

```typescript
paginationPrev: '\u2190 Prev',
paginationNext: 'Next \u2192',
paginationPage: (current, total) => `Page ${current} of ${total}`,
```

In `popupRu` (after line 179 `copiedSelector`):

```typescript
paginationPrev: '\u2190 Назад',
paginationNext: 'Вперёд \u2192',
paginationPage: (current, total) => `Стр. ${current} из ${total}`,
```

- [ ] **Step 2: Add pagination HTML to popup.html**

In `src/ui/popup.html`, add after the results container (after line 73):

```html
<div id="pagination-container" class="pagination-container" style="display:none;">
  <button id="pagination-prev" class="btn btn-pagination">\u2190 Prev</button>
  <span id="pagination-info">Page 1 of 1</span>
  <button id="pagination-next" class="btn btn-pagination">Next \u2192</button>
</div>
```

- [ ] **Step 3: Add pagination CSS to popup.css**

In `src/ui/popup.css`, add after the `.history-badge.zero` block (after line 477):

```css
/* ---------- pagination ---------- */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 14px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.btn-pagination {
  flex: none;
  padding: 5px 12px;
  font-size: 11px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-pagination:hover:not(:disabled) {
  background: var(--color-btn-secondary-bg);
}

.btn-pagination:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

#pagination-info {
  font-size: 11px;
  color: var(--color-text-muted);
  min-width: 80px;
  text-align: center;
}
```

- [ ] **Step 4: Bind and initialize pagination elements in popup.ts**

In `src/ui/popup.ts`, add after line 83 (`private activeCriterion: string = 'all';`):

```typescript
private activeTab: string = 'issues';
private currentPage: number = 1;
private pageSize: number = 20;

private paginationContainer!: HTMLElement;
private paginationPrev!: HTMLButtonElement;
private paginationNext!: HTMLButtonElement;
private paginationInfo!: HTMLElement;
```

In `bindElements()`, add after line 86:

```typescript
this.paginationContainer = document.getElementById('pagination-container') as HTMLElement;
this.paginationPrev = document.getElementById('pagination-prev') as HTMLButtonElement;
this.paginationNext = document.getElementById('pagination-next') as HTMLButtonElement;
this.paginationInfo = document.getElementById('pagination-info') as HTMLElement;
```

In `initializeEventListeners()`, add after line 136 (`});` closing the settingsOverlay listener):

```typescript
this.paginationPrev.addEventListener('click', () => {
  if (this.currentPage > 1) {
    this.currentPage--;
    if (this.currentResult) this.renderIssuesList(this.currentResult.issues);
  }
});

this.paginationNext.addEventListener('click', () => {
  if (this.currentResult) {
    const groups = this.computeGroups(this.currentResult.issues);
    const totalPages = Math.ceil(groups.length / this.pageSize) || 1;
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderIssuesList(this.currentResult.issues);
    }
  }
});
```

- [ ] **Step 5: Extract group computation into a method**

Add `computeGroups()` method before `renderIssuesList()`:

```typescript
private computeGroups(issues: AccessibilityIssue[]): Array<{ selector: string; issues: AccessibilityIssue[] }> {
  let filtered = this.activeFilter === 'all'
    ? issues
    : issues.filter((i) => i.impact === this.activeFilter);

  if (this.activeCriterion !== 'all') {
    filtered = filtered.filter((i) => i.wcagCriteria.includes(this.activeCriterion));
  }

  const groups = new Map<string, AccessibilityIssue[]>();
  filtered.forEach((issue) => {
    const key = this.buildSelector(issue);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(issue);
  });

  return Array.from(groups.entries()).map(([selector, groupIssues]) => ({ selector, issues: groupIssues }));
}
```

- [ ] **Step 6: Update renderIssuesList to paginate**

Replace the body of `renderIssuesList()` (lines 441-488) with:

```typescript
private renderIssuesList(issues: AccessibilityIssue[]): void {
  this.resultsContainer.innerHTML = '';

  const groups = this.computeGroups(issues);

  if (groups.length === 0) {
    const ui = getPopupUi(this.uiLocale);
    this.resultsContainer.innerHTML =
      this.activeFilter === 'all'
        ? `<p class="placeholder">${this.escapeHtml(ui.placeholderNoIssues)}</p>`
        : `<p class="placeholder">${this.escapeHtml(formatNoFilteredIssuesPlaceholder(this.uiLocale, this.activeFilter))}</p>`;
    this.paginationContainer.style.display = 'none';
    return;
  }

  const totalPages = Math.ceil(groups.length / this.pageSize);
  if (this.currentPage > totalPages) this.currentPage = totalPages;

  const start = (this.currentPage - 1) * this.pageSize;
  const pageGroups = groups.slice(start, start + this.pageSize);

  pageGroups.forEach(({ selector, issues: groupIssues }) => {
    if (groupIssues.length === 1) {
      this.resultsContainer.appendChild(this.buildIssueCard(groupIssues[0], selector));
    } else {
      const group = document.createElement('div');
      group.className = 'element-group';
      const header = document.createElement('div');
      header.className = 'element-group-header';
      header.innerHTML = `<span>${this.escapeHtml(selector)}</span><span>${groupIssues.length} issues</span>`;
      group.appendChild(header);
      const body = document.createElement('div');
      body.className = 'element-group-body';
      groupIssues.forEach((issue) => body.appendChild(this.buildIssueCard(issue, selector)));
      group.appendChild(body);
      this.resultsContainer.appendChild(group);
    }
  });

  if (totalPages > 1) {
    this.paginationContainer.style.display = 'flex';
    const ui = getPopupUi(this.uiLocale);
    this.paginationPrev.disabled = this.currentPage <= 1;
    this.paginationNext.disabled = this.currentPage >= totalPages;
    this.paginationInfo.textContent = ui.paginationPage(this.currentPage, totalPages);
  } else {
    this.paginationContainer.style.display = 'none';
  }
}
```

- [ ] **Step 7: Reset page on filter change**

Add `this.currentPage = 1;` at the start of filter button and criterion select handlers:

In the filter button handler (around line 115), add after `this.activeFilter = btn.dataset['filter'] ?? 'all';`:

```typescript
this.activeFilter = btn.dataset['filter'] ?? 'all';
this.currentPage = 1;  // ADD THIS
```

In the criterion select handler (after line 110):

```typescript
this.activeCriterion = this.wcagCriterionSelect.value;
this.currentPage = 1;  // ADD THIS
```

- [ ] **Step 8: Build and run tests**

Run: `npm run build && npm test`
Expected: Build succeeds. 106 tests pass (no pagination tests yet — we add those in a test task after all features).

- [ ] **Step 9: Commit**

```bash
git add src/ui/popup.ts src/ui/popup.html src/ui/popup.css src/i18n/messages.ts
git commit -m "feat: add pagination to issues list (20 per page)

Adds prev/next controls when scan results exceed 20 grouped items.
Page resets on filter/criterion change. EN/RU i18n strings included.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: T-405 — Scan Diff (Compare Two Results)

**Files:**
- Modify: `src/ui/popup.ts` — diff logic, diff button in history
- Modify: `src/ui/popup.css` — diff styling
- Modify: `src/i18n/messages.ts` — diff strings

- [ ] **Step 1: Add i18n strings for diff**

In `src/i18n/messages.ts`, add to `PopupUiStrings` interface:

```typescript
diffCompare: string;
diffExit: string;
diffNew: string;
diffFixed: string;
diffUnchanged: string;
diffSummary: (nNew: number, nFixed: number, nUnchanged: number) => string;
```

In `popupEn`:

```typescript
diffCompare: 'Compare with previous',
diffExit: 'Exit diff',
diffNew: 'New',
diffFixed: 'Fixed',
diffUnchanged: 'Unchanged',
diffSummary: (nNew, nFixed, nUnchanged) => `${nNew} new, ${nFixed} fixed, ${nUnchanged} unchanged`,
```

In `popupRu`:

```typescript
diffCompare: 'Сравнить с предыдущим',
diffExit: 'Выйти из сравнения',
diffNew: 'Новые',
diffFixed: 'Исправлено',
diffUnchanged: 'Без изменений',
diffSummary: (nNew, nFixed, nUnchanged) => `${nNew} новых, ${nFixed} исправлено, ${nUnchanged} без изменений`,
```

- [ ] **Step 2: Add storage for diff state in PopupUI**

In `src/ui/popup.ts`, add after `private currentResult: ScanResult | null = null;` (line 46):

```typescript
private diffMode: 'diff' | 'normal' = 'normal';
private diffPrevious: ScanResult | null = null;
```

Add diff button reference after existing element declarations:

```typescript
private diffBtn!: HTMLButtonElement;
```

- [ ] **Step 3: Add diff button to popup.html**

In `src/ui/popup.html`, add a diff button in the actions bar (after line 19, before settings-btn):

```html
<button id="diff-btn" class="btn btn-secondary" style="display:none;">Compare with previous</button>
```

- [ ] **Step 4: Bind diff button**

In `bindElements()` of popup.ts, after line 65:

```typescript
this.diffBtn = document.getElementById('diff-btn') as HTMLButtonElement;
```

In `initializeEventListeners()`, add after line 97 (theme button listener):

```typescript
this.diffBtn.addEventListener('click', () => void this.toggleDiff());
```

- [ ] **Step 5: Add issue key helper**

Add method to popup.ts:

```typescript
private issueKey(issue: AccessibilityIssue): string {
  return this.buildSelector(issue) + '|' + (issue.wcagCriteria[0] ?? issue.id);
}
```

- [ ] **Step 6: Add diff logic**

In popup.ts, add:

```typescript
private async toggleDiff(): Promise<void> {
  if (this.diffMode === 'diff') {
    this.diffMode = 'normal';
    this.diffBtn.textContent = getPopupUi(this.uiLocale).diffCompare;
    if (this.currentResult) this.displayResults(this.currentResult);
    return;
  }

  if (!this.currentResult) return;

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getAllScans' });
    if (!response?.success || !Array.isArray(response.results)) return;
    const results: ScanResult[] = response.results;

    // Find the most recent scan for the same URL that is not the current one
    const prev = results.find(
      (r) => r.url === this.currentResult!.url && r.id !== this.currentResult!.id,
    );
    if (!prev) return;

    this.diffMode = 'diff';
    this.diffPrevious = prev;
    const ui = getPopupUi(this.uiLocale);
    this.diffBtn.textContent = ui.diffExit;
    this.renderDiffView(prev, this.currentResult);
  } catch {
    /* ignore */
  }
}

private renderDiffView(prev: ScanResult, curr: ScanResult): void {
  this.summaryContainer.style.display = 'block';
  this.exportActions.style.display = 'flex';

  const prevKeys = new Set(prev.issues.map((i) => this.issueKey(i)));
  const currKeys = new Set(curr.issues.map((i) => this.issueKey(i)));

  const newIssues = curr.issues.filter((i) => !prevKeys.has(this.issueKey(i)));
  const fixedIssues = prev.issues.filter((i) => !currKeys.has(this.issueKey(i)));
  const unchanged = curr.issues.filter((i) => prevKeys.has(this.issueKey(i)));

  this.resultsContainer.innerHTML = '';

  const ui = getPopupUi(this.uiLocale);
  const summary = document.createElement('div');
  summary.className = 'diff-summary';
  summary.innerHTML = `<p>${this.escapeHtml(ui.diffSummary(newIssues.length, fixedIssues.length, unchanged.length))}</p>`;
  this.resultsContainer.appendChild(summary);

  const legend = document.createElement('div');
  legend.className = 'diff-legend';
  legend.innerHTML = `
    <span class="diff-legend-item diff-new">${this.escapeHtml(ui.diffNew)}</span>
    <span class="diff-legend-item diff-fixed">${this.escapeHtml(ui.diffFixed)}</span>
    <span class="diff-legend-item diff-unchanged">${this.escapeHtml(ui.diffUnchanged)}</span>
  `;
  this.resultsContainer.appendChild(legend);

  const renderSection = (title: string, issues: AccessibilityIssue[], cssClass: string) => {
    if (issues.length === 0) return;
    const section = document.createElement('div');
    section.className = 'diff-section';
    const h3 = document.createElement('h3');
    h3.className = `diff-section-title ${cssClass}`;
    h3.textContent = `${title} (${issues.length})`;
    section.appendChild(h3);
    issues.forEach((issue) => {
      const selector = this.buildSelector(issue);
      const card = this.buildIssueCard(issue, selector);
      card.classList.add(cssClass);
      section.appendChild(card);
    });
    this.resultsContainer.appendChild(section);
  };

  renderSection(ui.diffNew, newIssues, 'diff-new');
  renderSection(ui.diffFixed, fixedIssues, 'diff-fixed');
  renderSection(ui.diffUnchanged, unchanged, 'diff-unchanged');

  this.paginationContainer.style.display = 'none';
}

private async findPreviousScan(url: string, currentId: string): Promise<ScanResult | null> {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getAllScans' });
    if (!response?.success || !Array.isArray(response.results)) return null;
    return (response.results as ScanResult[]).find(
      (r) => r.url === url && r.id !== currentId,
    ) ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 7: Show diff button when previous scan of same URL exists**

Update `displayResults()` (line 410) to check for previous scan and show the diff button:

Add at the beginning of `displayResults()`:

```typescript
private displayResults(result: ScanResult): void {
  this.diffMode = 'normal';
  this.summaryContainer.style.display = 'grid';
  this.exportActions.style.display = 'flex';

  // Check if a previous scan exists for this URL
  void this.findPreviousScan(result.url, result.id).then((prev) => {
    if (prev) {
      const ui = getPopupUi(this.uiLocale);
      this.diffBtn.textContent = ui.diffCompare;
      this.diffBtn.style.display = '';
    } else {
      this.diffBtn.style.display = 'none';
    }
  });

  // ... rest of displayResults unchanged
```

Also hide diff button in `clearResults()` (around line 385):

```typescript
this.diffBtn.style.display = 'none';
```

- [ ] **Step 8: Add diff CSS to popup.css**

In `src/ui/popup.css`, add after pagination styles:

```css
/* ---------- diff view ---------- */
.diff-summary {
  padding: 8px 12px;
  background: var(--color-surface-alt);
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.diff-legend {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 11px;
}

.diff-legend-item {
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 500;
}

.diff-section {
  margin-bottom: 14px;
}

.diff-section-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  padding: 4px 8px;
  border-radius: 4px;
}

.diff-new {
  border-left: 3px solid #dc2626 !important;
}

.diff-new.diff-section-title {
  background: #fecaca;
  color: #991b1b;
}

.diff-fixed {
  border-left: 3px solid #16a34a !important;
}

.diff-fixed.diff-section-title {
  background: #bbf7d0;
  color: #166534;
}

.diff-unchanged {
  border-left: 3px solid #94a3b8 !important;
}

.diff-unchanged.diff-section-title {
  background: #e2e8f0;
  color: #475569;
}

.diff-new.diff-legend-item { background: #fecaca; color: #991b1b; }
.diff-fixed.diff-legend-item { background: #bbf7d0; color: #166534; }
.diff-unchanged.diff-legend-item { background: #e2e8f0; color: #475569; }
```

- [ ] **Step 9: Build and test**

Run: `npm run build && npm test`
Expected: Build succeeds. 106 tests pass.

- [ ] **Step 10: Commit**

```bash
git add src/ui/popup.ts src/ui/popup.html src/ui/popup.css src/i18n/messages.ts
git commit -m "feat: add scan diff — compare two results for same URL

Uses selector+wcagCriteria as issue matching key. Shows new/fixed/unchanged
sections with color coding. Diff button auto-appears when previous scan
for the same URL exists.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: T-402 — Debounced DOM Watch (Auto-Rescan)

**Files:**
- Modify: `src/types/accessibility.ts` — add `watchDomChanges` field
- Modify: `src/utils/settings-defaults.ts` — default value
- Modify: `src/scripts/content-script.ts` — MutationObserver logic
- Modify: `src/ui/popup.ts` — settings binding
- Modify: `src/ui/popup.html` — settings checkbox
- Modify: `src/i18n/messages.ts` — label string

- [ ] **Step 1: Add watchDomChanges to Settings type**

In `src/types/accessibility.ts`, add after `autoScanOnLoad: boolean;` (line 25):

```typescript
/** When true, re-scans page after DOM changes settle (2s debounce, max 5 auto-scans) */
watchDomChanges: boolean;
```

- [ ] **Step 2: Add default value**

In `src/utils/settings-defaults.ts`, add after `autoScanOnLoad: false,`:

```typescript
watchDomChanges: false,
```

- [ ] **Step 3: Add i18n string**

In `src/i18n/messages.ts`, add to `PopupUiStrings` interface:

```typescript
settingWatchDom: string;
```

In `popupEn`:

```typescript
settingWatchDom: 'Auto-rescan on DOM changes',
```

In `popupRu`:

```typescript
settingWatchDom: 'Автопересканирование при изменении DOM',
```

- [ ] **Step 4: Add checkbox to popup.html settings modal**

In `src/ui/popup.html`, add after the auto-scan checkbox (after line 110):

```html
<div class="modal-field">
  <label for="setting-watch-dom" id="setting-watch-dom-label">Auto-rescan on DOM changes</label>
  <input type="checkbox" id="setting-watch-dom">
</div>
```

- [ ] **Step 5: Bind settings checkbox in popup.ts**

In `bindElements()`, add after line 83 (`this.settingAutoScan` line):

```typescript
private settingWatchDom!: HTMLInputElement;
```

And in the `bindElements` method body, after the auto-scan line:

```typescript
this.settingWatchDom = document.getElementById('setting-watch-dom') as HTMLInputElement;
```

In `loadSettings()` (around line 234, after setting `this.settingAutoScan`):

```typescript
this.settingWatchDom.checked = s.watchDomChanges;
```

In `saveSettings()` (around line 311), add to partial:

```typescript
watchDomChanges: this.settingWatchDom.checked,
```

In `applyPopupUi()`, set the label (after line 289):

```typescript
(document.getElementById('setting-watch-dom-label') as HTMLElement).textContent = ui.settingWatchDom;
```

- [ ] **Step 6: Add MutationObserver to content-script.ts**

In `src/scripts/content-script.ts`, add these fields to the class (after line 9 `private settings: Settings;`):

```typescript
private domObserver: MutationObserver | null = null;
private domDebounceTimer: ReturnType<typeof setTimeout> | null = null;
private autoScanCount: number = 0;
private isScanning: boolean = false;
private readonly MAX_AUTO_SCANS = 5;
private readonly DEBOUNCE_MS = 2000;
```

Add observer methods:

```typescript
private setupDomWatcher(): void {
  if (!this.settings.watchDomChanges) {
    this.teardownDomWatcher();
    return;
  }

  if (this.domObserver) return; // already watching

  this.domObserver = new MutationObserver((mutations) => {
    const hasRelevantChanges = mutations.some(
      (m) => m.type === 'childList' && m.addedNodes.length > 0,
    );
    if (!hasRelevantChanges) return;
    if (this.autoScanCount >= this.MAX_AUTO_SCANS) return;

    this.scheduleAutoScan();
  });

  this.domObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });

  window.addEventListener('beforeunload', () => this.teardownDomWatcher(), { once: true });
  this.logger.info('DOM watcher started');
}

private scheduleAutoScan(): void {
  if (this.domDebounceTimer) {
    clearTimeout(this.domDebounceTimer);
  }

  this.domDebounceTimer = setTimeout(() => {
    if (this.isScanning) return;
    if (this.autoScanCount >= this.MAX_AUTO_SCANS) return;

    this.autoScanCount++;
    this.logger.info(`Auto-scan triggered (${this.autoScanCount}/${this.MAX_AUTO_SCANS})`);
    void this.performScan();
  }, this.DEBOUNCE_MS);
}

private teardownDomWatcher(): void {
  if (this.domObserver) {
    this.domObserver.disconnect();
    this.domObserver = null;
  }
  if (this.domDebounceTimer) {
    clearTimeout(this.domDebounceTimer);
    this.domDebounceTimer = null;
  }
  this.logger.info('DOM watcher stopped');
}
```

Update `performScan()` to set `isScanning` flag:

```typescript
private async performScan(): Promise<ScanResult> {
  this.isScanning = true;
  this.logger.info('Starting accessibility scan...');

  try {
    // ... existing scan logic (lines 98-118)
  } finally {
    this.isScanning = false;
  }
}
```

Add the `isScanning = false` in a finally block around the existing scan logic.

Update the `updateSettings` handler to start/stop the watcher:

In the `case 'updateSettings':` block (around line 65-70), after updating settings and scanner:

```typescript
case 'updateSettings':
  if (request.settings) {
    this.settings = { ...this.settings, ...request.settings };
    this.scanner = new Scanner(this.settings);
    if (request.settings.watchDomChanges !== undefined) {
      if (this.settings.watchDomChanges) {
        this.setupDomWatcher();
      } else {
        this.teardownDomWatcher();
      }
    }
  }
  sendResponse({ success: true });
  return true;
```

Add watcher initialization to `autoScanIfEnabled()` — after getting settings, also set up DOM watcher:

After line 33 (`}` catch block of autoScanIfEnabled), add:

```typescript
if (this.settings.watchDomChanges) {
  this.setupDomWatcher();
}
```

- [ ] **Step 7: Build and run tests**

Run: `npm run build && npm test`
Expected: Build succeeds. 106 tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/scripts/content-script.ts src/types/accessibility.ts src/utils/settings-defaults.ts src/ui/popup.ts src/ui/popup.html src/i18n/messages.ts
git commit -m "feat: add debounced DOM watch for auto-rescan on page changes

MutationObserver watches for childList mutations with 2s debounce.
Max 5 auto-scans per page load. Toggle via settings. Observer ignores
own highlights (data-a11y-highlight). Disconnects on beforeunload.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Run Full Test Suite & Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npm test`

- [ ] **Step 2: Run lint**

Run: `npm run lint`

- [ ] **Step 3: Run production build**

Run: `npm run build`

Verify: `dist/src/scripts/` contains `content-script.js` (~25KB) and `axe-core.[hash].js` (~660KB)

- [ ] **Step 4: Verify all 4 features work end-to-end**

1. Load extension in Chrome from `dist/`
2. Scan a page → verify pagination appears when >20 issues
3. Scan same page again → verify "Compare with previous" button appears
4. Enable "Auto-rescan on DOM changes" in settings → verify rescans occur after page changes
5. Verify axe-core chunk loads on first scan, not page load

- [ ] **Step 5: Update PROGRESS.md and TASKS.md**

Update Stage 4 status in both files to ✅ Завершён.

- [ ] **Step 6: Final commit**

```bash
git add PROGRESS.md TASKS.md
git commit -m "docs: mark Stage 4 — Performance as complete

4 features delivered: bundle split (dynamic import), issue pagination,
scan diff, and debounced DOM watch for auto-rescan.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
