import { localizeAxeFailureSummary } from '../src/i18n/axe-failure-summary';

describe('localizeAxeFailureSummary', () => {
  it('leaves text unchanged for English locale', () => {
    const s = 'Fix any of the following:\n  item';
    expect(localizeAxeFailureSummary(s, 'en')).toBe(s);
  });

  it('translates "any" prefix for Russian locale', () => {
    const s = 'Fix any of the following:\n  line1\n  line2';
    expect(localizeAxeFailureSummary(s, 'ru')).toBe(
      'Исправьте любое из следующего:\n  line1\n  line2',
    );
  });

  it('translates "all" prefix for Russian locale', () => {
    const s = 'Fix all of the following:\n  a';
    expect(localizeAxeFailureSummary(s, 'ru')).toBe('Исправьте все из следующего:\n  a');
  });
});
