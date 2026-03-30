# Installation Guide

## Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Google Chrome** 110+ (also works with Edge, Brave, and other Chromium-based browsers)

## Step 1: Clone the Repository

```bash
git clone https://github.com/vozzhaevsn/A11y_Checker.git
cd A11y_Checker
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Build the Extension

Production build (minified):

```bash
npm run build
```

Development build with watch mode:

```bash
npm run build:dev
```

Both commands produce output in the `dist/` directory.

## Step 4: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder inside the project directory
5. The A11y Checker Pro icon should appear in the toolbar

## Step 5: Using the Extension

1. Navigate to any web page
2. Click the **A11y Checker Pro** icon in the toolbar
3. Click **Scan Page**
4. Review the results: summary cards at the top, detailed issues below
5. Click an issue to expand details and highlight the element on the page
6. Use **Export JSON / HTML / CSV** to download a report

## Configuration

### WCAG Level

Select **A**, **AA**, or **AAA** from the dropdown in the popup. This controls both axe-core and custom checker strictness.

### Settings

Click **Settings** to toggle individual checker categories:

- Color contrast
- Image alt text
- Semantic structure
- Keyboard accessibility

### Context Menu

Right-click on any page and select **Check page accessibility** to trigger a scan without opening the popup.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension icon doesn't appear | Make sure you loaded from `dist/`, not the project root |
| "Could not inject content script" | Refresh the page and try again; some chrome:// pages are restricted |
| Scan takes too long | Try on pages with fewer DOM elements; axe-core analyses the entire document |
| Build fails | Delete `node_modules/` and `dist/`, then run `npm install && npm run build` |

## Development

```bash
npm run build:dev  # watch mode — rebuilds on save
npm test           # run test suite
npm run lint       # run ESLint
```
