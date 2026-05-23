# A11y Checker Pro

Automated accessibility checker for web pages — a Chrome extension (Manifest V3) powered by [axe-core](https://github.com/dequelabs/axe-core).

## Features

- **axe-core integration** — industry-standard accessibility engine with 80+ rules
- **Custom checkers** — color contrast, images, semantic structure, keyboard navigation
- **WCAG A / AA / AAA** — switch conformance level on the fly
- **Export reports** — JSON, HTML, or CSV with one click
- **DevTools panel** — deeper analysis inside Chrome DevTools
- **Element highlighting** — click any issue to scroll to and highlight the element on the page
- **Settings** — toggle individual check categories, language (EN/RU), dark/light theme
- **History** — last 50 scan results stored in `chrome.storage.local`, with history tab
- **Dark theme** — CSS custom properties with manual toggle
- **Auto-scan** — automatically scan on page load (configurable)
- **Extension badge** — critical/serious issue count on toolbar icon
- **WCAG criterion filter** — filter issues by specific WCAG criteria
- **Group by element** — issues grouped by CSS selector to reduce visual clutter

## Quick Start

```bash
git clone https://github.com/vozzhaevsn/A11y_Checker.git
cd A11y_Checker
npm install
npm run build
```

Then load `dist/` as an unpacked extension in `chrome://extensions`.

See [docs/INSTALLATION.md](./INSTALLATION.md) for detailed instructions.

## Architecture

```
src/
├── types/           # TypeScript interfaces (all types)
├── core/            # Scanner, AxeEngine, Validator
├── checkers/        # ContrastChecker, ImageChecker, SemanticChecker, KeyboardChecker
├── scripts/         # content-script.ts, background.ts, devtools.ts
├── ui/              # popup.html/css/ts, devtools-panel.html/ts
└── utils/           # Logger, ExportUtil, settings-defaults
```

| Component | Role |
|-----------|------|
| **Content Script** | Injected into web pages; runs axe-core + custom checkers; highlights elements |
| **Service Worker** | Handles messages, persists results in `chrome.storage.local` |
| **Popup** | Main UI — scan button, summary cards, issue list, export buttons, settings |
| **DevTools Panel** | Alternative interface inside Chrome DevTools |

## WCAG Checks Performed

| Category | WCAG Criterion | Severity |
|----------|---------------|----------|
| Color contrast | 1.4.3 (AA), 1.4.6 (AAA) | Critical–Moderate |
| Image alt text | 1.1.1 (A) | Critical |
| Page title | 2.4.2 (A) | Serious |
| Heading hierarchy | 1.3.1 (A) | Moderate |
| Landmark regions | 1.3.1 (A) | Moderate |
| Form labels | 1.3.1 (A), 3.3.2 (AA) | Serious |
| Keyboard access | 2.1.1 (A) | Serious |
| Focus indicators | 2.4.7 (AA) | Moderate |
| Skip-link | 2.4.1 (A) | Moderate |
| Page language | 3.1.1 (A) | Serious |
| Reduced motion | 2.3.3 (AAA) | Minor |
| ARIA attributes | 4.1.2 (A) | Serious |

Plus 80+ additional checks provided by axe-core.

## Testing

```bash
npm test            # run tests with coverage
npm run test:watch  # watch mode
```

**Coverage: 86%+** across 106 tests in 13 suites.

## Tech Stack

- TypeScript 5+, Webpack 5, Chrome Extension Manifest V3
- axe-core 4.11+
- Jest + ts-jest + jsdom for testing

## License

MIT
