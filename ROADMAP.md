# ROADMAP — A11y Checker Pro

## Текущее состояние

v1.2.0 — все этапы (0–5) завершены. Расширение собирается, 106 тестов проходят, 13 suites, локализация EN/RU, экспорт JSON/HTML/CSV, тёмная тема, авто-скан, история, бейдж, пагинация, diff сканов, ленивая загрузка axe-core, DOM watch, релизный CI.

---

## Этап 0 — Стабилизация ✅ ЗАВЕРШЁН

- [x] `.nvmrc` — Node.js 22
- [x] `engines` в `package.json` — `>=18`
- [x] `npm audit fix` — уязвимости исправлены
- [x] `npm run build` — собирается без ошибок
- [x] `npm test` — 106 тестов проходят
- [x] `npm run lint` — без ошибок
- [x] GitHub Actions CI (lint → test → build)
- [x] Husky + lint-staged pre-commit hook
- [x] Зависимости обновлены (minor/patch)
- [x] Документация скорректирована

---

## Этап 1 — Качество и надёжность ✅ ЗАВЕРШЁН

- [x] Тёмная тема (CSS custom properties, `data-theme`, ручное переключение)
- [x] `autoScanOnLoad` в content-script — авто-скан при загрузке страницы
- [x] Тесты для `devtools-panel.ts` (349 строк, полное покрытие)
- [x] GitHub Actions CI — lint, test, build на push/PR
- [x] Husky + lint-staged прекоммит хук
- [x] Обновлены минорные зависимости

---

## Этап 2 — UX-улучшения ✅ ЗАВЕРШЁН

- [x] История сканирований — вкладка History (последние 10 URL + relative time + бейдж)
- [x] Бейдж на иконке расширения (красный/оранжевый/зелёный)
- [x] Фильтрация по WCAG-критерию (dropdown)
- [x] Группировка проблем по элементу (CSS selector)
- [x] Кнопка «Скопировать CSS-селектор»
- [x] WCAG-чипы с tooltip (критерии в виде tag-ов)
- [x] Вкладки Issues / History
- [ ] ~~Diff двух сканирований~~ — отложен до Stage 4

---

## Этап 3 — Расширение проверок (приоритет: ВЫСОКИЙ) ✅ ЗАВЕРШЁН

Цель: улучшить охват и точность WCAG-проверок.

- [x] Проверка `<html lang="">` — WCAG 3.1.1 (A) — `checkPageLang()`
- [x] Проверка skip-links — WCAG 2.4.1 (A) — `checkSkipLinks()`
- [x] Проверка `prefers-reduced-motion` — WCAG 2.3.3 (AAA) — `checkReducedMotion()`
- [x] Проверка ARIA-атрибутов (`aria-label`, `aria-labelledby` без контента) — `checkAriaAttributes()`
- [x] Проверка tabindex > 0 антипаттернов — `isTabIndexValid()`
- [x] Обновить axe-core до последней версии (4.11.4)

---

## Этап 4 — Производительность и масштабирование (приоритет: СРЕДНИЙ) ✅ ЗАВЕРШЁН

Цель: расширение работает быстро на тяжёлых SPA-страницах.

- [x] Пагинация списка проблем в popup (20 групп на страницу)
- [x] Инкрементальное сканирование (MutationObserver + debounce)
- [x] Web Worker для axe-core — заменено на lazy import (DOM-зависимость)
- [x] Оптимизация бандла webpack (lazy import axe-core, 678KB→122KB)
- [x] Diff двух сканирований (новые / исправленные / без изменений)
- [x] Scan-in-progress guard, фильтр highlight-мутаций, beforeunload cleanup

---

## Этап 5 — Публикация и дистрибуция (приоритет: НИЗКИЙ) ✅ ЗАВЕРШЁН

Цель: опубликовать расширение в Chrome Web Store.

- [x] Написать store-описание (EN + RU) — `docs/store-listing.md`
- [x] Privacy disclosure с обоснованием каждого permission
- [x] Настроить автоматический release (GitHub Actions → zip + GitHub Release)
- [x] `npm run zip` для локальной упаковки
- [x] Версия 1.0.0 → 1.2.0, CHANGELOG обновлён
- [ ] Подготовить промо-скриншоты (1280x800, 640x400) — требуется ручная работа в Chrome
- [ ] Пройти review Chrome Web Store — требуется ручная подача
- [ ] Рассмотреть Firefox-совместимость — за рамками текущего скоупа
