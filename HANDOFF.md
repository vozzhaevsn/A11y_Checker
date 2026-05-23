# HANDOFF — контекст для следующего разработчика

## Проект

**A11y Checker Pro** — Chrome-расширение (Manifest V3) для проверки веб-страниц на соответствие WCAG 2.1.

## Стек

TypeScript 5 + Webpack 5 + axe-core 4.8.0 + Jest 29. Нет фреймворков.

## Текущее состояние

Stages 0–2 завершены. Сборка работает (`npm run build` → `dist/`). 93 теста, 13 suites. Локализация EN/RU. Экспорт JSON/HTML/CSV. Тёмная тема, авто-скан, история, бейдж, WCAG-фильтр, группировка по элементам, копирование селектора.

## Ключевые файлы

| Файл | Роль |
|------|------|
| `manifest.json` | Конфиг расширения (пути `src/` → webpack → `dist/src/`) |
| `src/core/scanner.ts` | Главный оркестратор всех проверок |
| `src/core/axe-engine.ts` | Обёртка axe-core |
| `src/checkers/` | 4 кастомных проверщика (contrast/images/keyboard/semantic) |
| `src/scripts/background.ts` | Service Worker, маршрутизация, storage, badge |
| `src/scripts/content-script.ts` | Инжектируется в страницу, запускает Scanner, autoScanOnLoad |
| `src/ui/popup.ts` | Главный UI-контроллер (623 строки) |
| `src/ui/devtools-panel.ts` | DevTools-панель |
| `src/utils/settings-defaults.ts` | Значения по умолчанию + нормализация |
| `src/utils/export.ts` | JSON/HTML/CSV экспорт |
| `src/i18n/` | Все переводы EN/RU |

## Что НЕ сделано (следующий приоритет — Этап 3)

1. Проверка `<html lang="">` — WCAG 3.1.1
2. Проверка skip-links — WCAG 2.4.1
3. Проверка `prefers-reduced-motion` — WCAG 2.3.3
4. Проверка ARIA-атрибутов (`aria-label`, `aria-labelledby`)
5. Проверка tabindex > 0 антипаттернов
6. Обновление axe-core до последней версии

## С чего начинать

Первый приоритет — **Этап 3: Расширение проверок** (TASKS.md: T-301 до T-306):
1. T-301: Проверка lang атрибута в SemanticChecker
2. T-302: Проверка skip-links в SemanticChecker
3. T-303: Проверка prefers-reduced-motion
4. T-304: Проверка ARIA-атрибутов
5. T-305: Проверка tabindex > 0
6. T-306: Обновить axe-core

## Документация

- `PRODUCT_SPEC.md` — полная спецификация продукта
- `ROADMAP.md` — этапы разработки
- `TASKS.md` — конкретные задачи с файлами
- `PROGRESS.md` — лог прогресса
- `docs/README.md`, `docs/API.md` — техническая документация
