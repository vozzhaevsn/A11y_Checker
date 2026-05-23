# Chrome Web Store Listing — A11y Checker Pro

## Short Description (EN)

Instantly scan any webpage for WCAG 2.1 accessibility issues. 80+ automated checks, dark theme, export reports.

## Short Description (RU)

Мгновенная проверка веб-страниц на доступность по WCAG 2.1. 80+ проверок, тёмная тема, экспорт отчётов.

---

## Detailed Description (EN)

A11y Checker Pro is a professional accessibility auditing tool that runs directly in Chrome DevTools. It combines the power of the axe-core engine (80+ rules) with custom checkers for color contrast, images, semantic structure, and keyboard navigation.

**Key Features:**

- **One-click scan** — analyze any page instantly with axe-core 4.11 and custom checkers
- **WCAG 2.1 Levels A / AA / AAA** — filter results by conformance level and specific criteria
- **Color contrast** — detect insufficient text contrast with ancestor background traversal
- **Semantic checks** — heading hierarchy, landmarks, form labels, page language, skip-links, ARIA attributes, reduced-motion media queries
- **Keyboard accessibility** — focus indicators, tabindex validation, keyboard traps
- **Image alt text** — missing, generic, and decorative image detection
- **Dark theme** — comfortable for extended use
- **EN / RU localization** — full interface, checker messages, and export reports in both languages
- **Export reports** — JSON (structured data), HTML (styled report), CSV (spreadsheet-ready)
- **Scan history** — last 10 scans with timestamps and quick comparison
- **Scan diff** — compare two scans of the same URL (new, fixed, unchanged issues)
- **Auto-scan** — optional scan on page load and automatic rescan on DOM changes
- **DevTools panel** — integrated into Chrome Developer Tools
- **Privacy-first** — all data stored locally, no external requests, no analytics

**Who is this for?**

Web developers, QA engineers, accessibility specialists, and anyone building for the web who wants to catch accessibility issues during development.

The extension uses the open-source axe-core engine (same engine used by Google Lighthouse) and supplements it with custom checkers for areas not fully covered by automated rules.

---

## Detailed Description (RU)

A11y Checker Pro — профессиональный инструмент для аудита доступности, работающий прямо в Chrome DevTools. Сочетает мощь движка axe-core (80+ правил) с собственными проверками контрастности, изображений, семантической структуры и навигации с клавиатуры.

**Ключевые возможности:**

- **Сканирование в один клик** — мгновенный анализ страницы с помощью axe-core 4.11 и дополнительных проверок
- **Уровни WCAG 2.1 A / AA / AAA** — фильтрация по уровню соответствия и конкретным критериям
- **Цветовой контраст** — обнаружение недостаточного контраста текста с обходом фона до корневого элемента
- **Семантические проверки** — иерархия заголовков, ориентиры (landmarks), подписи форм, язык страницы, skip-links, ARIA-атрибуты, медиа-запросы reduced-motion
- **Доступность с клавиатуры** — индикаторы фокуса, валидация tabindex, клавиатурные ловушки
- **Alt-текст изображений** — отсутствующие, общие (generic) и декоративные изображения
- **Тёмная тема** — комфортная работа в течение длительного времени
- **Локализация EN / RU** — полный интерфейс, сообщения проверок и экспорт отчётов на двух языках
- **Экспорт отчётов** — JSON (структурированные данные), HTML (стилизованный отчёт), CSV (для таблиц)
- **История сканирований** — последние 10 результатов с временными метками и быстрым сравнением
- **Diff сканирований** — сравнение двух проверок одного URL (новые, исправленные, без изменений)
- **Авто-сканирование** — опциональное сканирование при загрузке страницы и автоматическое пересканирование при изменениях DOM
- **Панель DevTools** — интеграция в Chrome Developer Tools
- **Приватность** — все данные хранятся локально, никаких внешних запросов, никакой аналитики

**Для кого?**

Веб-разработчики, QA-инженеры, специалисты по доступности и все, кто создаёт веб-продукты и хочет выявлять проблемы доступности на этапе разработки.

Расширение использует открытый движок axe-core (тот же, что используется в Google Lighthouse) и дополняет его собственными проверками для областей, не полностью покрываемых автоматическими правилами.

---

## Category

Accessibility

## Language

English, Russian

---

## Privacy Disclosure

A11y Checker Pro does not collect, transmit, or share any personal data. All scan results and settings are stored locally on your device using Chrome's storage API. The extension does not make any network requests to external servers. No analytics, crash reporting, or tracking mechanisms are included.

**Permissions justification:**

- `activeTab` — to scan the current page content
- `storage` — to save scan history and settings locally
- `scripting` — to inject the content script for scanning
- `contextMenus` — to add a right-click "Check accessibility" menu item
- `host_permissions: <all_urls>` — required by axe-core to analyze DOM elements across all websites

## Screenshots (Required: 1280x800 or 640x400)

1. Popup — issues list with summary cards
2. Popup — dark theme with scan results
3. Popup — settings modal
4. DevTools panel
5. Exported HTML report

> Screenshots must be captured manually from the built extension.
> Take screenshots at 1280x800 resolution for best quality.
