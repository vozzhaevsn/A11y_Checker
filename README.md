# A11y Checker Pro

> Automated accessibility checker for web pages — Chrome extension (Manifest V3) powered by axe-core.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **axe-core** engine with 80+ accessibility rules
- **Custom checkers**: color contrast, images, semantic structure, keyboard navigation
- **WCAG A / AA / AAA** conformance levels
- **Export reports**: JSON, HTML, CSV
- **DevTools panel** for deeper analysis
- **Element highlighting**: click an issue to scroll to and highlight the element
- **Settings**: toggle individual check categories on/off
- **History**: last 50 scans stored locally

## Quick Start

```bash
git clone https://github.com/vozzhaevsn/A11y_Checker.git
cd A11y_Checker
npm install
npm run build
```

Load `dist/` as an unpacked extension in `chrome://extensions` (Developer mode enabled).

## Usage

1. Navigate to any web page
2. Click the A11y Checker Pro toolbar icon
3. Click **Scan Page**
4. Review results — filter by severity, click to highlight elements
5. Export as JSON / HTML / CSV

## Development

```bash
npm run build:dev   # watch mode
npm test            # 78 tests, 88%+ coverage
npm run lint        # ESLint
```

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [API Reference](docs/API.md)
- [Changelog](CHANGELOG.md)

## Tech Stack

| Tool | Version |
|------|---------|
| TypeScript | 5.0+ |
| Webpack | 5+ |
| axe-core | 4.8+ |
| Chrome Extension | Manifest V3 |
| Jest | 29+ |

## Project Structure

```
src/
├── types/           # TypeScript type definitions
├── core/            # Scanner, AxeEngine, Validator
├── checkers/        # Contrast, Images, Semantic, Keyboard
├── scripts/         # content-script, background (service worker), devtools
├── ui/              # popup (HTML/CSS/TS), devtools panel
└── utils/           # Logger, Storage, Export
tests/               # Jest test suites
assets/icons/        # Extension icons (16/48/128px)
docs/                # Documentation
```

## License

MIT — Semyon Vozzhaev
