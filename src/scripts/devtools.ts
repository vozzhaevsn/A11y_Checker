/**
 * DevTools entry script.
 * Creates a custom panel and wires messages between panel UI and background.
 */

chrome.devtools.panels.create(
  'A11y Checker',
  'assets/icons/icon16.png',
  'src/ui/devtools-panel.html',
  (panel) => {
    panel.onShown.addListener((_window) => {
      // Panel shown - UI will handle initialization
    });
  }
);