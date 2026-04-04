import type { Settings } from '../types';
import { DEFAULT_LOCALE } from '../i18n/locale';

export function createDefaultSettings(): Settings {
  return {
    wcagLevel: 'AA',
    locale: DEFAULT_LOCALE,
    includeColorContrast: true,
    includeImages: true,
    includeKeyboard: true,
    includeSemantics: true,
    autoScanOnLoad: false,
    theme: 'light',
  };
}

export function normalizeSettings(partial?: Partial<Settings> | null): Settings {
  return { ...createDefaultSettings(), ...partial };
}
