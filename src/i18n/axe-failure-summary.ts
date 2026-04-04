import type { AppLocale } from './locale';

/** English prefixes from axe-core default failure summary functions */
const PREFIX_ANY_EN = 'Fix any of the following:';
const PREFIX_ALL_EN = 'Fix all of the following:';

/** Russian equivalents (same as axe locales/ru.json, but we avoid doT.compile / CSP) */
const PREFIX_ANY_RU = 'Исправьте любое из следующего:';
const PREFIX_ALL_RU = 'Исправьте все из следующего:';

export function localizeAxeFailureSummary(text: string, locale: AppLocale): string {
  if (locale !== 'ru') return text;
  if (text.startsWith(PREFIX_ANY_EN)) {
    return PREFIX_ANY_RU + text.slice(PREFIX_ANY_EN.length);
  }
  if (text.startsWith(PREFIX_ALL_EN)) {
    return PREFIX_ALL_RU + text.slice(PREFIX_ALL_EN.length);
  }
  return text;
}
