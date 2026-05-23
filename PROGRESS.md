# PROGRESS — A11y Checker Pro

## Статус: ✅ Этап 4 — Производительность

Проект находится в состоянии завершённых Stages 0–4.

---

## Что уже сделано

### MVP v1.0.0 (2026-03-30)

- [x] Chrome Extension Manifest V3 структура
- [x] axe-core интеграция (80+ правил, WCAG A/AA/AAA)
- [x] ContrastChecker (WCAG 1.4.3 / 1.4.6)
- [x] ImageChecker (WCAG 1.1.1)
- [x] SemanticChecker (заголовки, лендмарки, формы)
- [x] KeyboardChecker (навигация, фокус)
- [x] Popup UI (scan, фильтры, настройки, экспорт)
- [x] DevTools-панель
- [x] Локализация EN / RU
- [x] Экспорт JSON / HTML / CSV
- [x] chrome.storage.local (история 50 сканирований)

### Stages 0–2 (2026-05-23)

- [x] `.nvmrc` + `engines` в package.json
- [x] GitHub Actions CI (lint → test → build)
- [x] Husky + lint-staged pre-commit hook
- [x] Обновление минорных зависимостей
- [x] Тёмная тема (CSS custom properties)
- [x] `autoScanOnLoad` в content-script
- [x] Тесты DevTools-панели
- [x] Бейдж на иконке расширения
- [x] История сканирований (вкладка History)
- [x] Фильтр по WCAG-критерию
- [x] Группировка проблем по элементу
- [x] Копирование CSS-селектора
- [x] WCAG criterion chips
- [x] Тесты: 106 тестов, 13 suites
- [x] Чистка: удалён мёртвый StorageUtil, VKR.md, старые планы

### Stage 3 (2026-05-23)

- [x] Проверка `<html lang="">` — `checkPageLang()`, WCAG 3.1.1 (A)
- [x] Проверка skip-links — `checkSkipLinks()`, WCAG 2.4.1 (A)
- [x] Проверка prefers-reduced-motion — `checkReducedMotion()`, WCAG 2.3.3 (AAA)
- [x] Проверка ARIA-атрибутов — `checkAriaAttributes()`, WCAG 4.1.2 (A)
- [x] Проверка tabindex > 0 — `isTabIndexValid()` (уже было в KeyboardChecker)
- [x] Обновление axe-core 4.8.0 → 4.11.4
- [x] Тесты: 106 тестов, 13 suites (+13 новых для SemanticChecker)

### Stage 4 — Производительность (2026-05-23)

- [x] T-401: Пагинация — 20 групп на страницу, prev/next, сброс при смене фильтра
- [x] T-402: Debounced DOM Watch — MutationObserver, 2s debounce, max 5 auto-scans
- [x] T-403: Voice-over announcer — заменён на debounced DOM watch (T-402)
- [x] T-404: Bundle optimization — lazy import axe-core, content-script.js 678KB→122KB (82%)
- [x] T-405: Scan diff — сравнение с предыдущим сканом того же URL, new/fixed/unchanged

---

## Этапы по плану

| Этап | Название | Статус |
|------|---------|--------|
| Этап 0 | Стабилизация | ✅ Завершён |
| Этап 1 | Качество и надёжность | ✅ Завершён |
| Этап 2 | UX-улучшения | ✅ Завершён |
| Этап 3 | Расширение проверок | ✅ Завершён |
| Этап 4 | Производительность | ✅ Завершён |
| Этап 5 | Публикация | 🔲 Не начат |

---

## Лог изменений

| Дата | Изменение |
|------|-----------|
| 2026-05-23 | Stage 4 завершён: пагинация, DOM watch, lazy axe-core (678→122KB), scan diff |
| 2026-05-23 | Stage 3 завершён: axe-core обновлён 4.8.0→4.11.4, все 6 задач готовы, документация синхронизирована |
| 2026-05-23 | Stage 3: lang, skip-links, prefers-reduced-motion, ARIA, улучшен tabindex — добавлены в SemanticChecker + 13 новых тестов |
| 2026-05-23 | Stages 0–2 завершены: тёмная тема, авто-скан, CI, бейдж, история, WCAG-фильтр, группировка, копирование селектора |
| 2026-05-23 | Чистка: удалён StorageUtil, VKR.md, старые планы; документация актуализирована |
| 2026-05-23 | Аудит проекта. Созданы PRODUCT_SPEC.md, ROADMAP.md, TASKS.md, PROGRESS.md, HANDOFF.md |
