export type AppLocale = 'en' | 'ru';

export const DEFAULT_LOCALE: AppLocale = 'en';

export function isAppLocale(value: string | undefined): value is AppLocale {
  return value === 'en' || value === 'ru';
}
