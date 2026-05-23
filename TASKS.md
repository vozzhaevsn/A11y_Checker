# TASKS — A11y Checker Pro

Конкретные задачи по этапам из ROADMAP.md.
Статусы: `[ ]` не начато | `[~]` в работе | `[x]` сделано | `[!]` заблокировано

---

## ЭТАП 0 — Стабилизация ✅

### T-001: Проверить manifest.json пути `[x]`
- Пути ссылаются на `src/`, webpack выводит в `dist/src/` — корректно
- **Файлы:** `manifest.json`, `webpack.config.js`

### T-002: Верифицировать production build `[x]`
- `npm run build` — собирается успешно
- `dist/` содержит все 5 entry points + HTML/CSS/assets

### T-003: Верифицировать тесты `[x]`
- `npm test` — 93 теста, 13 suites, все зелёные

### T-004: Верифицировать линтер `[x]`
- `npm run lint` — без ошибок

### T-005: Ручное E2E-тестирование `[ ]`
- Не автоматизировано. Ручное тестирование в Chrome.

### T-006: Зафиксировать версию Node.js `[x]`
- `.nvmrc` = `22`, `engines` = `>=18`
- **Файлы:** `.nvmrc`, `package.json`

---

## ЭТАП 1 — Качество и надёжность ✅

### T-101: Тёмная тема `[x]`
- CSS-переменные в `popup.css`, `[data-theme="dark"]`
- Ручное переключение в Settings + кнопка быстрого тогла
- **Файлы:** `src/ui/popup.css`, `src/ui/popup.html`, `src/ui/popup.ts`

### T-102: autoScanOnLoad `[x]`
- `content-script.ts`: авто-скан при `settings.autoScanOnLoad === true`
- **Файлы:** `src/scripts/content-script.ts`

### T-103: Тесты для DevTools-панели `[x]`
- `tests/devtools-panel.test.ts` — 349 строк
- **Файлы:** `tests/devtools-panel.test.ts`, `jest.config.js`

### T-104: GitHub Actions CI `[x]`
- `.github/workflows/ci.yml`: lint + test + build
- Node 22, npm ci

### T-105: Pre-commit hooks `[x]`
- Husky + lint-staged: `eslint --fix` на staged `*.ts`

### T-106: Обновление зависимостей `[x]`
- Minor/patch обновлены. Major updates (jest 30, eslint 10, typescript 6) отложены.

---

## ЭТАП 2 — UX-улучшения ✅

### T-201: История сканирований в popup `[x]`
- Вкладка «History», последние 10 URL, relative time, бейдж
- **Файлы:** `src/ui/popup.ts`, `src/ui/popup.html`, `src/scripts/background.ts`

### T-202: Diff двух сканирований `[!]`
- Отложен до Stage 4 — требует изменений в storage schema

### T-203: Фильтр по WCAG-критерию `[x]`
- Dropdown с уникальными критериями из текущего результата
- **Файлы:** `src/ui/popup.ts`, `src/ui/popup.html`

### T-204: Группировка проблем по элементу `[x]`
- Группировка по CSS selector, collapsible группы
- **Файлы:** `src/ui/popup.ts`

### T-205: Badge с числом критических проблем `[x]`
- `chrome.action.setBadgeText/setBadgeBackgroundColor`
- Красный / оранжевый / зелёный
- **Файлы:** `src/scripts/background.ts`

### T-206: Копирование CSS-селектора `[x]`
- Кнопка «Copy selector», visual feedback «Copied!»
- **Файлы:** `src/ui/popup.ts`

---

## ЭТАП 3 — Расширение проверок ✅ (6/6)

### T-301: Проверка `<html lang="">` `[x]`
- Отсутствие или пустое значение — WCAG 3.1.1 (A)
- **Реализовано:** `checkPageLang()` в SemanticChecker
- **Файлы:** `src/checkers/semantic.ts`, `src/i18n/checker-messages.ts`

### T-302: Проверка skip-links `[x]`
- Наличие skip-link в начале страницы — WCAG 2.4.1 (A)
- **Реализовано:** `checkSkipLinks()` в SemanticChecker
- **Файлы:** `src/checkers/semantic.ts`, `src/i18n/checker-messages.ts`

### T-303: Проверка prefers-reduced-motion `[x]`
- CSS-анимации без `@media (prefers-reduced-motion)` — WCAG 2.3.3 (AAA)
- **Реализовано:** `checkReducedMotion()` + `collectAllStylesheetText()` в SemanticChecker
- **Файлы:** `src/checkers/semantic.ts`, `src/i18n/checker-messages.ts`

### T-304: Проверка ARIA-атрибутов `[x]`
- `aria-label` пустой, `aria-labelledby` ссылается на несуществующий id
- **Реализовано:** `checkAriaAttributes()` в SemanticChecker
- **Файлы:** `src/checkers/semantic.ts`, `src/i18n/checker-messages.ts`

### T-305: Проверка tabindex > 0 `[x]`
- Положительные значения tabindex — антипаттерн, WCAG 2.4.3
- **Реализовано:** `isTabIndexValid()` в KeyboardChecker (уже было в MVP)
- **Файлы:** `src/checkers/keyboard.ts`, `src/i18n/checker-messages.ts`

### T-306: Обновить axe-core `[x]`
- `npm install axe-core@latest` — обновлён с 4.8.0 до 4.11.4
- `axe-failure-summary.ts` — без изменений, обратная совместимость
- Все 106 тестов проходят, сборка успешна

---

## ЭТАП 4 — Производительность ✅ (5/5)

### T-401: Пагинация списка проблем `[x]`
- 20 групп на страницу, prev/next кнопки, сброс при смене фильтра/критерия
- **Файлы:** `src/ui/popup.ts`, `src/ui/popup.html`, `src/ui/popup.css`, `src/i18n/messages.ts`

### T-402: Debounced DOM Watch (авто-ресканирование) `[x]`
- MutationObserver на document.body (childList, subtree, attributes)
- Debounce 2s, максимум 5 авто-сканов, сброс счётчика после полного скана
- Toggle в Settings: «Auto-rescan on DOM changes»
- **Файлы:** `src/scripts/content-script.ts`, `src/ui/popup.ts`, `src/types/accessibility.ts`, `src/utils/settings-defaults.ts`, `src/ui/popup.html`, `src/i18n/messages.ts`

### T-403: Voice-over announcer `[x]`
- Заменён на T-402 (debounced DOM watch) — Web Worker для axe-core нецелесообразен (требует DOM)

### T-404: Оптимизация бандла (lazy import axe-core) `[x]`
- Динамический `import('axe-core')` — content-script.js 678KB→122KB (82%)
- Отдельный чанк `axe-core.[hash].js` (576KB) загружается только при сканировании
- **Файлы:** `src/core/axe-engine.ts`, `webpack.config.js`

### T-405: Diff сканирований `[x]`
- Сравнение текущего результата с предыдущим сканом того же URL
- Matching по `selector|wcagCriteria[0]`, категории new/fixed/unchanged
- Кнопка «Compare with previous» → «Exit diff» в popup
- **Файлы:** `src/ui/popup.ts`, `src/ui/popup.html`, `src/ui/popup.css`, `src/i18n/messages.ts`

---

## ЭТАП 5 — Публикация 🔲

### T-501: Подготовить Chrome Web Store материалы `[ ]`
### T-502: Автоматический release через GitHub Actions `[ ]`
