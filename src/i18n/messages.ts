import type { AppLocale } from './locale';

export type ImpactKey = 'critical' | 'serious' | 'moderate' | 'minor';

export interface PopupUiStrings {
  documentTitle: string;
  appTitle: string;
  subtitle: string;
  scanPage: string;
  clear: string;
  settings: string;
  wcagLevelLabel: string;
  filterAll: string;
  filterCritical: string;
  filterSerious: string;
  filterModerate: string;
  filterMinor: string;
  summaryTotal: string;
  summaryCritical: string;
  summarySerious: string;
  summaryModerate: string;
  summaryMinor: string;
  placeholderInitial: string;
  placeholderScanning: string;
  placeholderNoIssues: string;
  placeholderNoIssuesFiltered: string;
  exportJson: string;
  exportHtml: string;
  exportCsv: string;
  footerWcag: (level: string) => string;
  settingsTitle: string;
  settingLocaleLabel: string;
  settingContrast: string;
  settingImages: string;
  settingSemantics: string;
  settingKeyboard: string;
  settingsCancel: string;
  settingsSave: string;
  scanning: string;
  errorPrefix: string;
  issueWcagPrefix: string;
}

export interface ExportReportStrings {
  htmlLang: string;
  reportTitle: (url: string) => string;
  pageTitle: string;
  metaUrl: string;
  metaDate: string;
  metaWcagLevel: string;
  summaryTotal: string;
  summaryCritical: string;
  summarySerious: string;
  summaryModerate: string;
  summaryMinor: string;
  wcagLinePrefix: string;
}

export interface CsvStrings {
  headers: string[];
}

export interface DevToolsUiStrings {
  documentTitle: string;
  runScan: string;
  exportJson: string;
  clear: string;
  readyToScan: string;
  runningScan: string;
  scanFailed: string;
  unknownError: string;
  foundIssues: (total: number, critical: number) => string;
  noIssuesFound: string;
  noResultsYet: string;
  runScanFirst: string;
  exportedJson: string;
  resultsCleared: string;
  wcagPrefix: string;
}

const popupEn: PopupUiStrings = {
  documentTitle: 'A11y Checker Pro',
  appTitle: 'A11y Checker Pro',
  subtitle: 'WCAG accessibility checker for web pages',
  scanPage: 'Scan Page',
  clear: 'Clear',
  settings: 'Settings',
  wcagLevelLabel: 'WCAG Level:',
  filterAll: 'All',
  filterCritical: 'Critical',
  filterSerious: 'Serious',
  filterModerate: 'Moderate',
  filterMinor: 'Minor',
  summaryTotal: 'Total',
  summaryCritical: 'Critical',
  summarySerious: 'Serious',
  summaryModerate: 'Moderate',
  summaryMinor: 'Minor',
  placeholderInitial: 'Click "Scan Page" to start accessibility analysis',
  placeholderScanning: 'Running accessibility scan...',
  placeholderNoIssues: 'No accessibility issues found.',
  placeholderNoIssuesFiltered: 'No {filter} issues.',
  exportJson: 'Export JSON',
  exportHtml: 'Export HTML',
  exportCsv: 'Export CSV',
  footerWcag: (level) => `WCAG 2.1 Level ${level}`,
  settingsTitle: 'Settings',
  settingLocaleLabel: 'Interface language',
  settingContrast: 'Check color contrast',
  settingImages: 'Check image alt texts',
  settingSemantics: 'Check semantic structure',
  settingKeyboard: 'Check keyboard accessibility',
  settingsCancel: 'Cancel',
  settingsSave: 'Save',
  scanning: 'Scanning...',
  errorPrefix: 'Error:',
  issueWcagPrefix: 'WCAG',
};

const popupRu: PopupUiStrings = {
  documentTitle: 'A11y Checker Pro',
  appTitle: 'A11y Checker Pro',
  subtitle: 'Проверка доступности веб-страниц по WCAG',
  scanPage: 'Сканировать страницу',
  clear: 'Очистить',
  settings: 'Настройки',
  wcagLevelLabel: 'Уровень WCAG:',
  filterAll: 'Все',
  filterCritical: 'Критические',
  filterSerious: 'Серьёзные',
  filterModerate: 'Умеренные',
  filterMinor: 'Незначительные',
  summaryTotal: 'Всего',
  summaryCritical: 'Критические',
  summarySerious: 'Серьёзные',
  summaryModerate: 'Умеренные',
  summaryMinor: 'Незначительные',
  placeholderInitial: 'Нажмите «Сканировать страницу», чтобы начать анализ доступности',
  placeholderScanning: 'Выполняется проверка доступности...',
  placeholderNoIssues: 'Проблем доступности не найдено.',
  placeholderNoIssuesFiltered: 'Нет проблем уровня «{filter}».',
  exportJson: 'Экспорт JSON',
  exportHtml: 'Экспорт HTML',
  exportCsv: 'Экспорт CSV',
  footerWcag: (level) => `Уровень WCAG 2.1: ${level}`,
  settingsTitle: 'Настройки',
  settingLocaleLabel: 'Язык интерфейса',
  settingContrast: 'Проверять контрастность цветов',
  settingImages: 'Проверять альтернативный текст изображений',
  settingSemantics: 'Проверять семантическую структуру',
  settingKeyboard: 'Проверять доступность с клавиатуры',
  settingsCancel: 'Отмена',
  settingsSave: 'Сохранить',
  scanning: 'Сканирование...',
  errorPrefix: 'Ошибка:',
  issueWcagPrefix: 'WCAG',
};

const exportEn: ExportReportStrings = {
  htmlLang: 'en',
  reportTitle: (url) => `A11y Checker Report — ${url}`,
  pageTitle: 'A11y Checker Report',
  metaUrl: 'URL:',
  metaDate: 'Date:',
  metaWcagLevel: 'WCAG Level:',
  summaryTotal: 'Total',
  summaryCritical: 'Critical',
  summarySerious: 'Serious',
  summaryModerate: 'Moderate',
  summaryMinor: 'Minor',
  wcagLinePrefix: 'WCAG:',
};

const exportRu: ExportReportStrings = {
  htmlLang: 'ru',
  reportTitle: (url) => `Отчёт A11y Checker — ${url}`,
  pageTitle: 'Отчёт A11y Checker',
  metaUrl: 'Адрес:',
  metaDate: 'Дата:',
  metaWcagLevel: 'Уровень WCAG:',
  summaryTotal: 'Всего',
  summaryCritical: 'Критические',
  summarySerious: 'Серьёзные',
  summaryModerate: 'Умеренные',
  summaryMinor: 'Незначительные',
  wcagLinePrefix: 'WCAG:',
};

const csvEn: CsvStrings = {
  headers: ['ID', 'Element', 'Description', 'Impact', 'WCAG Criteria', 'Help', 'Fix Suggestions'],
};

const csvRu: CsvStrings = {
  headers: [
    'Идентификатор',
    'Элемент',
    'Описание',
    'Влияние',
    'Критерии WCAG',
    'Пояснение',
    'Рекомендации по исправлению',
  ],
};

const devtoolsEn: DevToolsUiStrings = {
  documentTitle: 'A11y Checker – DevTools',
  runScan: 'Run Accessibility Scan',
  exportJson: 'Export JSON',
  clear: 'Clear',
  readyToScan: 'Ready to scan',
  runningScan: 'Running scan...',
  scanFailed: 'Scan failed:',
  unknownError: 'unknown error',
  foundIssues: (total, critical) =>
    `Found ${total} issues (${critical} critical)`,
  noIssuesFound: 'No issues found.',
  noResultsYet: 'No scan results yet. Click "Run Accessibility Scan".',
  runScanFirst: 'Run a scan first.',
  exportedJson: 'Exported as JSON',
  resultsCleared: 'Results cleared',
  wcagPrefix: 'WCAG:',
};

const devtoolsRu: DevToolsUiStrings = {
  documentTitle: 'A11y Checker – DevTools',
  runScan: 'Запустить проверку доступности',
  exportJson: 'Экспорт JSON',
  clear: 'Очистить',
  readyToScan: 'Готово к сканированию',
  runningScan: 'Выполняется сканирование...',
  scanFailed: 'Ошибка сканирования:',
  unknownError: 'неизвестная ошибка',
  foundIssues: (total, critical) =>
    `Найдено проблем: ${total} (критических: ${critical})`,
  noIssuesFound: 'Проблем не найдено.',
  noResultsYet: 'Нет результатов. Нажмите «Запустить проверку доступности».',
  runScanFirst: 'Сначала выполните сканирование.',
  exportedJson: 'Экспортировано в JSON',
  resultsCleared: 'Результаты очищены',
  wcagPrefix: 'WCAG:',
};

const impactLabelsEn: Record<ImpactKey, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

const impactLabelsRu: Record<ImpactKey, string> = {
  critical: 'Критический',
  serious: 'Серьёзный',
  moderate: 'Умеренный',
  minor: 'Незначительный',
};

const filterKeyToImpact: Record<string, ImpactKey> = {
  critical: 'critical',
  serious: 'serious',
  moderate: 'moderate',
  minor: 'minor',
};

export function getPopupUi(locale: AppLocale): PopupUiStrings {
  return locale === 'ru' ? popupRu : popupEn;
}

export function getExportReportStrings(locale: AppLocale): ExportReportStrings {
  return locale === 'ru' ? exportRu : exportEn;
}

export function getCsvStrings(locale: AppLocale): CsvStrings {
  return locale === 'ru' ? csvRu : csvEn;
}

export function getDevToolsUi(locale: AppLocale): DevToolsUiStrings {
  return locale === 'ru' ? devtoolsRu : devtoolsEn;
}

export function getImpactLabel(locale: AppLocale, impact: ImpactKey): string {
  return locale === 'ru' ? impactLabelsRu[impact] : impactLabelsEn[impact];
}

export function getFilterPlaceholderFilterName(locale: AppLocale, filter: string): string {
  if (filter === 'all') return '';
  const impact = filterKeyToImpact[filter];
  if (!impact) return filter;
  return getImpactLabel(locale, impact).toLowerCase();
}

export function formatNoFilteredIssuesPlaceholder(locale: AppLocale, filter: string): string {
  const ui = getPopupUi(locale);
  const name = getFilterPlaceholderFilterName(locale, filter);
  return ui.placeholderNoIssuesFiltered.replace('{filter}', name);
}

export function contextMenuTitle(locale: AppLocale): string {
  return locale === 'ru' ? 'Проверить доступность страницы' : 'Check page accessibility';
}
