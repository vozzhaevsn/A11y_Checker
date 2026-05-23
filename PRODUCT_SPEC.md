# PRODUCT SPEC — A11y Checker Pro

## Что это

Chrome-расширение (Manifest V3) для автоматической проверки веб-страниц на соответствие стандарту доступности WCAG 2.1. Использует движок axe-core (80+ правил) и 4 собственных проверщика.

---

## Стек

| Слой | Технология |
|------|-----------|
| Язык | TypeScript 5.0+ |
| Сборка | Webpack 5 |
| Тесты | Jest 29 + ts-jest + jsdom |
| Движок a11y | axe-core 4.8.0 |
| API расширения | Chrome MV3, webextension-polyfill |
| Линтинг | ESLint 9 + @typescript-eslint |

---

## Архитектура

```
popup.ts ──→ background.ts (SW) ──→ content-script.ts
                 ↕                         ↓
           chrome.storage           Scanner.scanPage()
                                    ├── AxeEngine (axe-core)
                                    ├── ContrastChecker
                                    ├── ImageChecker
                                    ├── SemanticChecker
                                    └── KeyboardChecker
```

### Скрипты расширения

- **content-script.ts** — инжектируется в страницу, запускает Scanner, подсвечивает элементы
- **background.ts** — Service Worker, маршрутизация сообщений, сохранение результатов (макс. 50)
- **devtools.ts / devtools-panel.ts** — DevTools-панель (альтернативный UI)

### UI

- **popup.html/ts** — основной интерфейс: кнопка Scan, сводка, список проблем с фильтрацией, настройки, экспорт
- **devtools-panel.html/ts** — DevTools-вариант того же UI (исключён из тестов)

---

## Проверяемые правила

| Критерий WCAG | Тип | Реализован в |
|---------------|-----|-------------|
| 1.1.1 (A) — Альт текст изображений | custom | ImageChecker |
| 1.3.1 (A) — Семантика, заголовки, формы | custom | SemanticChecker |
| 1.4.3 (AA) — Контрастность текста | custom | ContrastChecker |
| 1.4.6 (AAA) — Усиленная контрастность | custom | ContrastChecker |
| 2.1.1 (A) — Клавиатурная навигация | custom | KeyboardChecker |
| 2.4.7 (AA) — Видимый фокус | custom | KeyboardChecker |
| 2.4.2 (A) — Заголовок страницы | custom | SemanticChecker |
| 4.1.2 (A) + 80+ правил | axe-core | AxeEngine |

---

## Типы данных

```typescript
// Результат одной проблемы
interface AccessibilityIssue {
  id: string;
  element: ElementInfo;          // selector, outerHTML, tag, text
  description: string;
  help: string;
  helpUrl: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  tags: string[];
  wcagLevels: ('A' | 'AA' | 'AAA')[];
  wcagCriteria: string[];
  fixSuggestions: string[];
}

// Результат сканирования
interface ScanResult {
  id: string;
  url: string;
  timestamp: number;
  summary: { total, critical, serious, moderate, minor };
  issues: AccessibilityIssue[];
  wcagLevel: 'A' | 'AA' | 'AAA';
}

// Настройки пользователя
interface Settings {
  wcagLevel: 'A' | 'AA' | 'AAA';
  locale: 'en' | 'ru';
  includeColorContrast: boolean;
  includeImages: boolean;
  includeKeyboard: boolean;
  includeSemantics: boolean;
  autoScanOnLoad: boolean;
  theme: 'light' | 'dark';   // ⚠️ не реализовано в UI
}
```

---

## Локализация

Поддерживаются языки: **English** и **Русский**.

Файлы i18n:
- `src/i18n/messages.ts` — UI-строки
- `src/i18n/checker-messages.ts` — сообщения проверщиков
- `src/i18n/axe-failure-summary.ts` — локализация axe-core (CSP-безопасно, без eval)
- `src/i18n/locale.ts` — типы локали

---

## Экспорт

| Формат | Содержимое |
|--------|-----------|
| JSON | Полный ScanResult в pretty-print |
| HTML | Стилизованный отчёт с карточками и цветовой кодировкой |
| CSV | Таблица: ID, Element, Description, Impact, WCAG, Help, Suggestions |

---

## Тесты

- **11 файлов**, **83 теста**, покрытие **86.1%**
- Исключены из покрытия: devtools-panel файлы
- Среда: jsdom (симуляция DOM)

---

## Известные ограничения / незавершённые фичи

| Проблема | Статус |
|---------|--------|
| `theme: 'dark'` в Settings — не реализовано в UI | Не сделано |
| `autoScanOnLoad` — не реализовано в UI | Не сделано |
| DevTools-панель исключена из тестов | Техдолг |
| VKR-директория в репо (академический документ) | Не влияет на работу |
| manifest.json ссылается на JS-файлы из `src/` (не `dist/`) | Требует проверки |

---

## Сборка и запуск

```bash
npm install
npm run build          # production → dist/
npm run build:dev      # watch-mode
npm test               # тесты + покрытие
npm run lint           # линтер
```

**Установка в Chrome:**
1. `npm run build`
2. `chrome://extensions` → Developer mode ON
3. "Load unpacked" → выбрать папку `dist/`
