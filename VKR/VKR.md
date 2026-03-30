# Бизнес-тезис «A11y Checker»: разработка прототипа системы автоматизированной проверки доступности на базе the A11y

## Тезисы к ВКР

---

## 1. Описание проекта

### 1.1. Что представляет собой проект

A11y Checker Pro — прототип браузерного расширения (Chrome Extension, Manifest V3), осуществляющего автоматизированную проверку веб-страниц на соответствие стандартам цифровой доступности WCAG 2.1/2.2 (уровни A, AA, AAA). Ядро системы построено на открытом движке axe-core (Deque Systems) и дополнено собственными модулями проверки контрастности, альтернативных текстов, семантической разметки и клавиатурной навигации. Результаты сканирования визуализируются в popup-интерфейсе расширения с возможностью экспорта отчётов в форматах JSON, HTML и CSV.

Проект позиционируется на стыке двух доменов:
- **Инструмент для разработчиков** — помогает веб-разработчикам и тестировщикам выявлять нарушения доступности на ранних стадиях разработки;
- **Бизнес-продукт** — позволяет компаниям снижать юридические риски (иски ADA/EAA), расширять аудиторию за счёт пользователей с инвалидностью и повышать конверсию e-commerce-площадок.

### 1.2. Ключевые функции прототипа

| Функция | WCAG-критерий | Реализация |
|---------|--------------|------------|
| Проверка контрастности текста | 1.4.3 (AA), 1.4.6 (AAA) | Собственный ContrastChecker + axe-core |
| Проверка альтернативных текстов изображений | 1.1.1 (A) | Собственный ImageChecker |
| Проверка семантической структуры (заголовки, landmarks, label) | 1.3.1 (A), 2.4.2 (A), 3.3.2 (AA) | Собственный SemanticChecker |
| Проверка клавиатурной доступности | 2.1.1 (A), 2.4.7 (AA) | Собственный KeyboardChecker |
| 80+ дополнительных проверок | Все уровни A/AA/AAA | Движок axe-core 4.8+ |
| Экспорт отчётов | — | JSON, HTML (стилизованный), CSV |
| Подсветка проблемных элементов на странице | — | Инъекция overlay через Content Script |
| Панель DevTools | — | Отдельная панель в Chrome DevTools |

---

## 2. Обоснование темы и актуальность

### 2.1. Глобальный масштаб проблемы доступности

По данным ВОЗ, более **1,3 млрд человек** (16% мирового населения) живут с той или иной формой инвалидности [1]. Из них порядка **2,2 млрд** имеют нарушения зрения различной степени тяжести (от лёгких до полной слепоты). Эти люди являются активными пользователями интернета: по данным Eurostat за 2024 год, **80% людей с инвалидностью в ЕС** пользуются интернетом [29], при этом значительная доля использует вспомогательные технологии (screen readers, альтернативные устройства ввода).

В России, по данным Росстата, зарегистрировано более **11 млн человек** с инвалидностью [2], причём доля пожилого населения (которое является основным «генератором» возрастных нарушений зрения и моторики) неуклонно растёт [19, 20]. Проникновение интернета среди данной группы составляет по различным оценкам 50–70% [21, 22].

### 2.2. Законодательное давление

**Европейский союз.** С 28 июня 2025 года вступил в силу **European Accessibility Act (EAA)** [5, 6], обязывающий все коммерческие веб-сервисы, e-commerce-платформы, банковские системы, телекоммуникационные услуги и транспортные сервисы соответствовать стандартам доступности. Штрафы за нарушение устанавливаются на национальном уровне и могут достигать значительных сумм [48, 49, 50, 51].

**США.** Количество судебных исков по ADA (Americans with Disabilities Act) в отношении веб-сайтов стабильно растёт: по данным UsableNet, в 2024 году было подано более **4 000 исков** [12], а тренд 2025–2026 годов указывает на дальнейший рост [47, 52].

**Россия.** Федеральный закон № 181-ФЗ «О социальной защите инвалидов» [7] и ст. 5.13 КоАП [8] устанавливают обязанность обеспечения доступности информации, в том числе в цифровой среде. Хотя правоприменительная практика в России менее развита, чем в ЕС и США, регуляторное давление нарастает.

### 2.3. Рыночная ситуация и инвестиционная привлекательность

Мировой рынок ПО для проверки цифровой доступности оценивается в **$0,7–1,2 млрд** (2024) с прогнозируемым CAGR **15–20%** до 2030 года [9, 10, 53]. Основные драйверы:
- Законодательное давление (EAA, ADA, Section 508);
- Рост количества судебных исков;
- Расширение ESG-повестки и корпоративной ответственности;
- Коммерческий интерес: доступные сайты демонстрируют рост конверсии до **12–15%** [38, 61].

Конкуренты (axe DevTools Pro, WAVE, Lighthouse, Stark, Tenon, Siteimprove) ориентированы на западный рынок с ценами **$49–499/мес** [11, 55, 56]. Ниша русскоязычного и регионально-адаптированного решения остаётся практически свободной.

---

## 3. Реализация проекта

### 3.1. Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        A11y Checker Pro                         │
├────────────────────────┬────────────────────────────────────────┤
│   Content Script       │   Service Worker (Background)          │
│   • axe-core 4.8+      │   • chrome.runtime message routing     │
│   • Custom Checkers     │   • chrome.storage.local persistence   │
│   • DOM highlight       │   • Context menu integration           │
├────────────────────────┼────────────────────────────────────────┤
│   Popup UI             │   DevTools Panel                       │
│   • Summary cards       │   • Detailed scan view                 │
│   • Issue list + filter │   • JSON export                        │
│   • WCAG level selector │                                        │
│   • Settings modal      │                                        │
│   • Export JSON/HTML/CSV│                                        │
└────────────────────────┴────────────────────────────────────────┘
```

### 3.2. Технологический стек

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| Язык | TypeScript | 5.0+ |
| Платформа | Chrome Extension (Manifest V3) | Chrome 110+ |
| Сборка | Webpack | 5+ |
| Движок проверок | axe-core | 4.8+ |
| Хранение | chrome.storage.local | — |
| Тестирование | Jest + ts-jest + jsdom | 29+ |
| Линтинг | ESLint + @typescript-eslint | 9 / 8 |

### 3.3. Этапы реализации

**Этап 1. Базовая инфраструктура**
- Manifest V3 конфигурация, webpack-сборка, TypeScript-типизация
- Content Script с инъекцией axe-core
- Background Service Worker с message-routing
- Popup UI с базовым отображением результатов

**Этап 2. Модули проверок WCAG**
- ContrastChecker (WCAG 1.4.3 / 1.4.6) — расчёт контрастности через алгоритм относительной яркости (W3C)
- ImageChecker (WCAG 1.1.1) — проверка alt-текстов, обнаружение декоративных изображений
- SemanticChecker (WCAG 1.3.1, 2.4.2, 3.3.2) — иерархия заголовков, landmarks, form labels
- KeyboardChecker (WCAG 2.1.1, 2.4.7) — фокус, tabindex, обработчики клавиатуры

**Этап 3. Отчётность и экспорт**
- Экспорт JSON (машиночитаемый), HTML (визуальный отчёт), CSV (табличный)
- Подсветка проблемных элементов на странице при клике

**Этап 4. Тестирование и документирование**
- 78 тестов, покрытие 88%+ (statements), 90%+ (lines)
- Документация: README, INSTALLATION, API, CHANGELOG

### 3.4. Метрики качества прототипа

| Метрика | Целевое значение | Достигнуто |
|---------|-----------------|-----------|
| Покрытие тестами (statements) | >80% | 88,3% |
| Покрытие тестами (lines) | >80% | 89,7% |
| Количество тестов | >50 | 78 |
| Время сборки (production) | <10 сек | ~5 сек |
| npm audit vulnerabilities | 0 | 0 |
| TypeScript strict mode | Да | Да |

---

## 4. Инструменты и подходы, исследуемые в ходе ВКР

### 4.1. Стандарты и спецификации

- **WCAG 2.1 / 2.2** — базовый стандарт доступности, определяющий 78 критериев успеха, сгруппированных по 4 принципам (Perceivable, Operable, Understandable, Robust) [14, 15]
- **WAI-ARIA 1.2** — спецификация ролей и атрибутов для обеспечения доступности динамических веб-приложений
- **ACT Rules** (Accessibility Conformance Testing) — формализованные правила тестирования, на основе которых построен axe-core [57]

### 4.2. Инструменты автоматизированного тестирования доступности

| Инструмент | Тип | Покрытие WCAG | Модель |
|-----------|-----|--------------|--------|
| axe-core (Deque) | Open-source библиотека | ~57% SC (автоматизируемых) | MIT |
| WAVE (WebAIM) | Веб-сервис + расширение | Визуальная диагностика | Freemium |
| Lighthouse (Google) | Встроен в Chrome DevTools | ~30 правил | Open-source |
| Pa11y | CLI + CI/CD | На базе axe/htmlcs | Open-source |
| Stark | Figma/Sketch/Browser plugin | Дизайн-ориентированный | $49–499/мес |

Сравнительный анализ покрытия автоматизированными инструментами приведён в [16, 45, 54, 58, 59].

### 4.3. Технологические подходы

- **Chrome Extension Manifest V3** — актуальная архитектура расширений Chrome: Service Worker вместо persistent background page, ограничение на удалённый код, строгая CSP [62, 63]
- **Content Script Injection** — изоляция JavaScript-контекста расширения от контекста страницы (isolated world) [64]
- **axe-core как embedded engine** — подход инлайн-бандлинга (579 КБ) вместо CDN-загрузки для обеспечения CSP-совместимости
- **Static Analysis Results Interchange Format (SARIF)** — стандарт обмена результатами статического анализа для интеграции с CI/CD (GitHub Code Scanning) [66]
- **Алгоритм расчёта контрастности WCAG** — формула относительной яркости (relative luminance) и контрастного соотношения, определённая в WCAG 2.1 §1.4.3 [15]

### 4.4. Бизнес-анализ и рыночные исследования

- Анализ рынка цифровой доступности: Grand View Research [9], Mordor Intelligence [10], Verified Market Research [53]
- Анализ поведения пользователей с инвалидностью: Eurostat (серия DSB_ICT) [4, 24, 33, 34, 35, 36, 37]
- Правовой анализ: EAA [5, 6, 25, 48, 49, 50, 51], ADA [12, 47, 52], ФЗ-181 [7]
- Экономический эффект доступности: рост конверсии [38, 61], рынок UBA/UEBA [39, 40]

---

## 5. Исследование вопросов бизнес-тезиса (спитч)

### 5.1. Рынок незрячих и слабовидящих: масштаб и бизнес-релевантность

**Глобально:**
- 2,2 млрд человек с нарушениями зрения (ВОЗ) [1]
- 1,3 млрд людей с инвалидностью в целом (16% населения) [1]
- В ЕС (27 стран): 101 млн человек (24,7% населения 16+) имеют ту или иную форму ограничений жизнедеятельности [27]

**Россия:**
- 11+ млн людей с официально установленной инвалидностью [2]
- Из них порядка 500 тыс. — инвалиды по зрению (I и II группы)
- 36+ млн людей старше 60 лет (стареющее население — растущий сегмент возрастных нарушений зрения) [19, 20]

**Для какого бизнеса актуален:**
- E-commerce (потенциальный рост конверсии 12–15% при обеспечении доступности) [38, 61]
- Банковский сектор (онлайн-банкинг — обязательная доступность по EAA) [5]
- Государственные и муниципальные порталы [35]
- Образовательные платформы [30, 31, 34, 41]
- Телеком и транспортные сервисы [5]
- Любой бизнес, работающий на рынке ЕС (обязательное требование EAA с июня 2025) [48, 49]

### 5.2. Сегментация аудитории: интернет-услуги, доход, уровень жизни

**Использование интернет-услуг (ЕС, 2024, по данным Eurostat):**

| Интернет-услуга | Люди с инвалидностью | Люди без инвалидности | Разрыв |
|----------------|---------------------|----------------------|--------|
| Социальные сети | ~70% | ~75% | −5 п.п. [24, 33] |
| Интернет-банкинг | ~55% | ~70% | −15 п.п. [36] |
| Взаимодействие с госорганами | ~60% | ~65% | −5 п.п. [35] |
| Онлайн-обучение | ~25% | ~30% | −5 п.п. [34] |
| Видеозвонки | ~50% | ~55% | −5 п.п. [37] |
| Общее использование интернета | 80% | 92% | −12 п.п. [29] |

**Доход и уровень жизни:**
- В ЕС доход домохозяйств с членом с инвалидностью в среднем на **20–30% ниже** медианного [32]
- В России средний доход инвалидов существенно ниже среднего по стране; уровень занятости — около **25%** (vs ~60% для населения в целом) [18, 42]
- Однако значительная часть расходов компенсируется государственными программами (пенсии, субсидии, льготы на связь), что формирует **стабильную (хоть и ограниченную) потребительскую базу** [7, 32]

**Отличия от обычных потребителей:**
- Более высокая зависимость от цифровых услуг (замена физического доступа)
- Более длительные сессии на сайтах (из-за использования screen readers)
- Повышенная лояльность к доступным сервисам (высокая стоимость переключения)
- Активное сарафанное радио внутри сообщества

### 5.3. Платёжеспособность аудитории

Аудитория людей с инвалидностью **не является целевым плательщиком** за продукт A11y Checker. Они — **бенефициары**, чьи потребности создают спрос у бизнеса.

Платёжеспособная сторона — **бизнес**:
- Компании, которым нужно соответствовать EAA/ADA/Section 508
- E-commerce-платформы, стремящиеся расширить аудиторию
- Банки и финтех (регуляторные требования)
- Веб-студии и агентства (услуги аудита доступности для клиентов)
- EdTech-платформы

При этом **совокупная покупательная способность** людей с инвалидностью и их семей оценивается глобально в **$8+ трлн** (по данным Return on Disability), что делает этот сегмент значимым для ритейла, финансов и телекома.

### 5.4. Основные сферы потребления аудитории

По данным Eurostat [33–37] и ВОЗ [1]:

1. **Финансовые услуги** — онлайн-банкинг, страхование, пенсионные системы
2. **Государственные услуги** — порталы госуслуг, социальные выплаты, записи к врачу
3. **Коммуникации** — мессенджеры, видеозвонки, социальные сети
4. **Образование** — онлайн-курсы, университетские платформы
5. **E-commerce** — продукты, одежда, электроника, лекарства
6. **Развлечения** — стриминг, подкасты, аудиокниги
7. **Здравоохранение** — телемедицина, аптечные сервисы

### 5.5. Государственная политика в области цифровой доступности

**Россия:**
- ФЗ от 24.11.1995 № 181-ФЗ «О социальной защите инвалидов» — обязывает обеспечивать доступ к информации [7]
- КоАП РФ, ст. 5.13 — административная ответственность за нарушение прав инвалидов на доступ к информации [8]
- ГК РФ, ст. 15 — возможность взыскания морального вреда за нарушение прав [46]
- ГОСТ Р 52872-2019 — национальный стандарт доступности веб-контента (гармонизирован с WCAG 2.0)
- Государственная программа «Доступная среда» (2011–2025) — включает цифровую составляющую

**Европейский Союз:**
- **European Accessibility Act (EAA)** — Директива 2019/882, вступила в силу 28 июня 2025 [5, 6, 48, 49, 50, 51]. Охватывает:
  - E-commerce и розничную торговлю
  - Банковские услуги
  - Телекоммуникации
  - Транспортные сервисы
  - Электронные книги
  - Мультимедийные сервисы
- **EN 301 549** — европейский стандарт доступности ИКТ (гармонизирован с WCAG 2.1)
- **Web Accessibility Directive (2016/2102)** — обязательная доступность сайтов государственного сектора [25]

**США:**
- **ADA (Americans with Disabilities Act)** — применяется к веб-сайтам как «местам общественного обслуживания»
- **Section 508** — обязательная доступность для федеральных организаций
- Рост судебных исков: 4 000+ в 2024, тренд к увеличению в 2025–2026 [12, 47, 52]
- Новые правила DOJ (2024): WCAG 2.1 AA как обязательный стандарт к 2026 [52]

### 5.6. Целевые сегменты бизнеса (кто наш клиент)

| Сегмент | Мотивация | Готовность платить |
|---------|----------|--------------------|
| **E-commerce** (средний и крупный) | EAA/ADA compliance + рост конверсии | Высокая — прямой ROI |
| **Банки и финтех** | Регуляторные требования EAA | Высокая — штрафы за несоблюдение |
| **Веб-студии и агентства** | Услуга аудита для клиентов | Средняя — как рабочий инструмент |
| **Государственные порталы** | Законодательные требования | Средняя — бюджетные закупки |
| **EdTech-платформы** | Инклюзивность, UNESCO-стандарты | Средняя |
| **SaaS-компании** | Требования enterprise-клиентов | Средняя-высокая |
| **Корпорации (ESG)** | ESG-отчётность, репутация | Высокая |

### 5.7. Кто первый заплатит

1. **Веб-студии и freelance-разработчики** — минимальный порог входа, инструмент для повседневной работы, модель freemium → Pro
2. **Средний e-commerce в ЕС** — давление EAA с июня 2025, срочная потребность в аудите
3. **Банки (compliance-отделы)** — регуляторный дедлайн, бюджет на compliance-инструменты
4. **Российские веб-студии** — появление запросов от клиентов на аудит доступности (растущий тренд)

### 5.8. Чьи проблемы решает продукт

| Стейкхолдер | Проблема | Как решает A11y Checker |
|-------------|---------|------------------------|
| **Люди с инвалидностью** | Недоступные веб-сайты | Косвенно — через улучшение сайтов |
| **Веб-разработчики** | Не знают требований WCAG, тратят время на ручную проверку | Автоматическое сканирование + рекомендации |
| **QA-инженеры** | Отсутствие инструмента доступности в тестовом пайплайне | Встроенный в браузер инструмент с экспортом |
| **Бизнес-владельцы** | Юридические риски (ADA/EAA иски), потеря аудитории | Отчёт о соответствии, приоритизация исправлений |
| **Compliance-офицеры** | Документирование соответствия стандартам | Экспорт отчётов в формализованном виде |
| **Дизайнеры** | Контрастность и визуальная доступность | Проверка контраста в реальном времени |

### 5.9. Кто готов тестировать

1. **Веб-разработчики из open-source сообщества** — через Product Hunt, Hacker News, Reddit (r/webdev, r/accessibility)
2. **Участники accessibility-сообществ** — A11y Project, WebAIM mailing list, W3C WAI Interest Group
3. **Студенты кафедр веб-разработки и UX** — через университетские программы
4. **Веб-студии малого и среднего размера** — pilot-программа «бесплатно 3 месяца» в обмен на feedback
5. **Компании-партнёры** — через B2B-пилоты с compliance-отделами банков и e-commerce
6. **Сообщества людей с инвалидностью** — ВОС (Всероссийское общество слепых), ONCE (Испания), RNIB (UK) — как бета-тестеры юзабилити самого расширения

---

## 6. Список источников

### Нормативные документы и стандарты

[1] World Health Organization. Disability and Health [Электронный ресурс]. — 2023. — URL: https://www.who.int/news-room/fact-sheets/detail/disability-and-health (дата обращения: 15.01.2025).

[2] Федеральная служба государственной статистики. Инвалидность в России [Электронный ресурс]. — 2023. — URL: https://rosstat.gov.ru/disability (дата обращения: 15.01.2025).

[5] European Commission. European Accessibility Act [Электронный ресурс]. — 2025. — URL: https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en (дата обращения: 15.01.2025).

[6] Accessible EU Centre. The EAA comes into effect in June 2025. Are you ready? [Электронный ресурс]. — 2025. — URL: https://accessible-eu-centre.ec.europa.eu/content-corner/news/eaa-comes-effect-june-2025-are-you-ready-2025-01-31_en (дата обращения: 15.01.2025).

[7] Федеральный закон от 24.11.1995 № 181-ФЗ «О социальной защите инвалидов в Российской Федерации» [Электронный ресурс]. — URL: https://www.consultant.ru/document/cons_doc_LAW_8647/ (дата обращения: 15.01.2025).

[8] Кодекс Российской Федерации об административных правонарушениях. Статья 5.13 [Электронный ресурс]. — URL: https://www.consultant.ru/document/cons_doc_LAW_34661/ (дата обращения: 15.01.2025).

[14] W3C Web Accessibility Initiative (WAI). Web Content Accessibility Guidelines (WCAG) Overview [Электронный ресурс]. — 2023. — URL: https://www.w3.org/WAI/standards-guidelines/wcag/ (дата обращения: 15.01.2025).

[15] W3C. Web Content Accessibility Guidelines 2.2 [Электронный ресурс]. — 2023. — URL: https://www.w3.org/TR/WCAG22/ (дата обращения: 15.01.2025).

[46] Гражданский кодекс Российской Федерации. Статья 15. Компенсация морального вреда [Электронный ресурс]. — URL: https://www.consultant.ru/document/cons_doc_LAW_5142/ (дата обращения: 15.01.2025).

### Статистика и демография

[3] Eurostat. Disability statistics — access to information and communication technologies [Электронный ресурс]. — 2024. — URL: https://ec.europa.eu/eurostat/statistics-explained/index.php/Disability_statistics_-_access_to_information_and_communication_technologies (дата обращения: 15.01.2025).

[4] Eurostat. Digital economy and society statistics — households and individuals [Электронный ресурс]. — 2025. — URL: https://ec.europa.eu/eurostat/statistics-explained/index.php/Digital_economy_and_society_statistics_-_households_and_individuals (дата обращения: 15.01.2025).

[19] Федеральная служба государственной статистики. Численность населения по возрастным группам [Электронный ресурс]. — 2023. — URL: https://rosstat.gov.ru/population/age (дата обращения: 15.01.2025).

[20] World Bank. Russian Federation Aging Project [Электронный ресурс]. — 2022. — URL: https://documents.worldbank.org/ru/publication/documents-reports/documentdetail/russian-federation-aging-project (дата обращения: 15.01.2025).

[21] Федеральная служба государственной статистики. Использование информационных технологий и информационно-телекоммуникационных сетей [Электронный ресурс]. — 2018. — URL: https://rosstat.gov.ru/it (дата обращения: 15.01.2025).

[22] ITU. Measuring digital development: Facts and figures 2023 [Электронный ресурс]. — 2023. — URL: https://www.itu.int/en/ITU-D/Statistics/Pages/facts/default.aspx (дата обращения: 15.01.2025).

[24] Eurostat. Persons using the internet for participating in social networks [Электронный ресурс]. — 2024. — URL: https://ec.europa.eu/eurostat/databrowser/product/view/dsb_ictiu05 (дата обращения: 15.01.2025).

[27] Eurostat. Population with disability — Statistics Explained [Электронный ресурс]. — 2024. — URL: https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Population_with_disability (дата обращения: 15.01.2025).

[28] Eurostat. Individuals — frequency of internet use [Электронный ресурс]. — 2025. — URL: https://ec.europa.eu/eurostat/databrowser/view/isoc_ci_ifp_fu/default/table?lang=en (дата обращения: 15.01.2025).

[29] Eurostat News. 80% of disabled people used the internet in 2024 [Электронный ресурс]. — 2025. — URL: https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20250827-1 (дата обращения: 15.01.2025).

[33] Eurostat. Persons using the internet for participating in social networks by level of disability [Электронный ресурс]. — 2024. — URL: https://ec.europa.eu/eurostat/databrowser/product/view/DSB_ICTIU05 (дата обращения: 15.01.2025).

[34] Eurostat. Persons using the internet for learning activities by level of disability [Электронный ресурс]. — 2024. — URL: https://ec.europa.eu/eurostat/databrowser/product/view/DSB_ICTIU03 (дата обращения: 15.01.2025).

[35] Eurostat. Persons using the internet for interaction with public authorities by level of disability [Электронный ресурс]. — 2024. — URL: https://ec.europa.eu/eurostat/databrowser/product/view/DSB_ICTEG01 (дата обращения: 15.01.2025).

[36] Eurostat. Persons using the internet for internet banking by level of disability [Электронный ресурс]. — 2024. — URL: https://ec.europa.eu/eurostat/databrowser/product/view/DSB_ICTIU07 (дата обращения: 15.01.2025).

[37] Eurostat. Persons using the internet for telephoning or video calls by level of disability [Электронный ресурс]. — 2024. — URL: https://ec.europa.eu/eurostat/databrowser/product/view/DSB_ICTIU04 (дата обращения: 15.01.2025).

### Рыночная аналитика

[9] Grand View Research. Digital Accessibility Software Market Size, Share & Trends Analysis Report [Электронный ресурс]. — 2024. — URL: https://www.grandviewresearch.com/industry-analysis/digital-accessibility-software-market-report (дата обращения: 15.01.2025).

[10] Mordor Intelligence. Accessibility Testing Market Size, Growth, Share & Forecast Report [Электронный ресурс]. — 2024. — URL: https://www.mordorintelligence.com/industry-reports/accessibility-testing-market (дата обращения: 15.01.2025).

[11] Stark. Pricing [Электронный ресурс]. — 2024. — URL: https://www.getstark.co/pricing (дата обращения: 15.01.2025).

[12] UsableNet. ADA Website Lawsuits Report 2024 [Электронный ресурс]. — 2024. — URL: https://usablenet.com/resources/ada-website-lawsuits-report-2024 (дата обращения: 15.01.2025).

[39] Cognitive Market Research. User Behavior Analytics Market Report [Электронный ресурс]. — 2024. — URL: https://www.cognitivemarketresearch.com/user-behavior-analytics-market-report (дата обращения: 15.01.2025).

[40] The Business Research Company. User and Entity Behavior Analytics Global Market Report [Электронный ресурс]. — 2024. — URL: https://www.thebusinessresearchcompany.com/report/user-and-entity-behavior-analytics-global-market-report (дата обращения: 15.01.2025).

[53] Verified Market Research. Accessibility Testing Tools Market Size, Share, Trends & Forecast [Электронный ресурс]. — 2024. — URL: https://www.verifiedmarketresearch.com/product/accessibility-testing-tools-market/ (дата обращения: 15.01.2025).

### Научные и аналитические публикации

[13] Возжаев С.Н. Академический проект «A11y Checker Pro»: от исследования к коммерческой модели [Электронный ресурс]. — 2025.

[18] Employment Of Disabled People In Russia In The Context Of The... [Электронный ресурс]. — 2018. — URL: https://ideas.repec.org/p/hig/wpaper/91sti2018.html (дата обращения: 15.01.2025).

[23] World Bank. Competing in the Digital Age: Policy Implications for the Russian Federation [Электронный ресурс]. — 2019. — URL: https://documents.worldbank.org/en/publication/documents-reports/documentdetail/competing-in-the-digital-age-policy-implications-for-the-russian-federation (дата обращения: 15.01.2025).

[25] European Commission. The EU becomes more accessible for all [Электронный ресурс]. — 2025. — URL: https://commission.europa.eu/news-and-media/news/eu-becomes-more-accessible-all-2025-07-31_en (дата обращения: 15.01.2025).

[26] European Commission. Web accessibility barriers and their cross-disability impact in eSystems [Электронный ресурс]. — 2024. — URL: https://www.sciencedirect.com/science/article/pii/S0920548924000928 (дата обращения: 15.01.2025).

[30] UNESCO. Understanding the impact of COVID-19 on the education of persons with disabilities [Электронный ресурс]. — 2021. — URL: https://unesdoc.unesco.org/ark:/48223/pf0000378404 (дата обращения: 15.01.2025).

[31] World Bank. Inclusion Problems in the Russian General Education System [Электронный ресурс]. — 2023. — URL: https://www.researchgate.net/publication/376666449_Inclusion_Problems_in_the_Russian_General_Education_System (дата обращения: 15.01.2025).

[32] OECD. Income Distribution and Poverty in Russia [Электронный ресурс]. — 2012. — URL: https://www.oecd.org/en/publications/income-distribution-and-poverty-in-russia_5k9csf9zcz7c-en.html (дата обращения: 15.01.2025).

[38] LinkedIn. How accessibility boosted our ecommerce revenue and conversions [Электронный ресурс]. — 2024. — URL: https://www.linkedin.com/posts/shubham-k-4a9134202_improving-conversion-rates-through-accessible-activity-7366006649360220163-hnA9 (дата обращения: 15.01.2025).

[41] OECD. Education at a Glance 2025 [Электронный ресурс]. — 2025. — URL: https://www.oecd.org/en/publications/education-at-a-glance-2025_1c0d9c79-en.html (дата обращения: 15.01.2025).

[42] ResearchGate. People with Disabilities in the Russian Labor Market [Электронный ресурс]. — 2022. — URL: https://www.researchgate.net/publication/364095953_People_with_Disabilities_in_the_Russian_Labor_Market_State_and_Prospects (дата обращения: 15.01.2025).

[45] W3C. Coverage of web accessibility guidelines provided by automated testing tools [Электронный ресурс]. — 2024. — URL: https://link.springer.com/article/10.1007/s10209-025-01263-x (дата обращения: 15.01.2025).

[51] IDEAS/RePEc. Citations of Investment under Uncertainty [Электронный ресурс]. — URL: https://ideas.repec.org/r/pup/pbooks/5474.html (дата обращения: 15.01.2025).

[60] ACM Digital Library. Automated Detection of Web Application Navigation Barriers [Электронный ресурс]. — 2024. — URL: https://escholarship.org/content/qt1p5547qp/qt1p5547qp.pdf (дата обращения: 15.01.2025).

### Правовой анализ (EAA/ADA)

[43] Microassist. Disability Accommodations Face New Pushback [Электронный ресурс]. — 2024. — URL: https://www.microassist.com/digital-accessibility/access-on-the-line-as-disability-accommodations-face-new-pushback/ (дата обращения: 15.01.2025).

[44] The Impact of the European Accessibility Act on E-Commerce [Электронный ресурс]. — 2024. — URL: https://accessiblemindstech.com/the-impact-of-the-european-accessibility-act-on-e-commerce/ (дата обращения: 15.01.2025).

[47] Accessible Minds Tech. ADA Web Lawsuits in 2026: Key Insights from 2025 Filings [Электронный ресурс]. — 2025. — URL: https://accessiblemindstech.com/ada-web-lawsuits-2026-insights-from-2025-filings/ (дата обращения: 15.01.2025).

[48] Osborne Clarke. The EU Accessibility Act – Two Months to Go! [Электронный ресурс]. — 2025. — URL: https://www.osborneclarke.com/insights/eu-accessibility-act-two-months-go (дата обращения: 15.01.2025).

[49] Inside Global Tech. European Accessibility Act: June 2025 deadline has arrived [Электронный ресурс]. — 2025. — URL: https://www.insideglobaltech.com/2025/06/10/european-accessibility-act-june-2025-deadline-has-arrived/ (дата обращения: 15.01.2025).

[50] LinkedIn. The EAA's impact across Europe: What changes after June 28, 2025? [Электронный ресурс]. — 2025. — URL: https://www.linkedin.com/pulse/eaas-impact-across-europe-what-changes-after-june-28-2025-48mjf (дата обращения: 15.01.2025).

[52] WordPress VIP. ADA Website Accessibility: WCAG 2.1 by 2026 [Электронный ресурс]. — 2024. — URL: https://wpvip.com/blog/ada-website-accessibility-deadline-2026/ (дата обращения: 15.01.2025).

### Инструменты и технологии

[16] Inclly. Best Free Accessibility Testing Tools Compared: axe vs WAVE vs Lighthouse [Электронный ресурс]. — 2024. — URL: https://inclly.com/resources/accessibility-testing-tools-comparison (дата обращения: 15.01.2025).

[17] Deque Systems. axe DevTools [Электронный ресурс]. — 2024. — URL: https://www.deque.com/axe/devtools/ (дата обращения: 15.01.2025).

[54] Dev.to. 2025 Guide: Best 10 Accessibility Testing Tools (Automated) [Электронный ресурс]. — 2025. — URL: https://dev.to/maria_bueno/2025-guide-best-10-accessibility-testing-tools-automated-41 (дата обращения: 15.01.2025).

[55] SoftwareSuggest. Tenon — Pricing, Features, and Details in 2026 [Электронный ресурс]. — 2025. — URL: https://www.softwaresuggest.com/tenon (дата обращения: 15.01.2025).

[56] Stack Overflow. Accessibility Insights automated test differ from Axe [Электронный ресурс]. — URL: https://stackoverflow.com/questions/64151819/accessibility-insights-automated-test-differ-from-axe (дата обращения: 15.01.2025).

[57] W3C. Axe DevTools Pro ACT Implementation [Электронный ресурс]. — 2024. — URL: https://www.w3.org/WAI/standards-guidelines/act/implementations/axe-devtools-pro/ (дата обращения: 15.01.2025).

[58] Springer. Coverage of web accessibility guidelines provided by automated testing tools [Электронный ресурс]. — 2025. — URL: https://link.springer.com/article/10.1007/s10209-025-01263-x (дата обращения: 15.01.2025).

[59] Inclly. Best Free Accessibility Testing Tools Compared [Электронный ресурс]. — 2024. — URL: https://inclly.com/resources/accessibility-testing-tools-comparison (дата обращения: 15.01.2025).

[61] LinkedIn. How accessibility boosted our ecommerce revenue and conversions [Электронный ресурс]. — 2024. — URL: https://www.linkedin.com/posts/shubham-k-4a9134202_improving-conversion-rates-through-accessible-activity-7366006649360220163-hnA9 (дата обращения: 15.01.2025).

### Технические руководства (Manifest V3, Content Scripts, SARIF)

[62] arXiv. The Impact of Google's Manifest Version 3 (MV3) Update on Ad Blockers [Электронный ресурс]. — 2025. — URL: https://arxiv.org/html/2503.01000 (дата обращения: 15.01.2025).

[63] Dev.to. Understanding Chrome Extensions: A Developer's Guide to Manifest V3 [Электронный ресурс]. — 2024. — URL: https://dev.to/javediqbal8381/understanding-chrome-extensions-a-developers-guide-to-manifest-v3-233l (дата обращения: 15.01.2025).

[64] Mozilla MDN. Content scripts [Электронный ресурс]. — URL: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts (дата обращения: 15.01.2025).

[65] Mozilla MDN. web_accessible_resources [Электронный ресурс]. — URL: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources (дата обращения: 15.01.2025).

[66] GitHub Docs. SARIF support for code scanning [Электронный ресурс]. — URL: https://docs.github.com/en/code-security/reference/code-scanning/sarif-support-for-code-scanning (дата обращения: 15.01.2025).

---

## 7. Заключение

Проект A11y Checker Pro представляет собой технически реализованный MVP браузерного расширения для автоматизированной проверки цифровой доступности, отвечающий на три ключевых вызова:

1. **Технологический** — интеграция axe-core в Manifest V3 расширение с собственными модулями проверки WCAG 2.1/2.2
2. **Регуляторный** — инструмент для бизнеса, нуждающегося в соответствии EAA (ЕС), ADA (США), ФЗ-181 (Россия)
3. **Коммерческий** — свободная ниша русскоязычного решения на растущем рынке ($0,7–1,2 млрд, CAGR 15–20%)

Бизнес-модель предполагает freemium-подход: бесплатная версия для разработчиков + платные Pro-функции (расширенные отчёты, CI/CD-интеграция, командная работа, мониторинг) для бизнеса. Первые платящие клиенты — веб-студии и средний e-commerce в ЕС, для которых соответствие EAA стало обязательным с июня 2025.
