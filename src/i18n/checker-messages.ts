import type { AppLocale } from './locale';

export function contrastInsufficientDescription(
  locale: AppLocale,
  ratio: number,
  levelLabel: string,
): string {
  if (locale === 'ru') {
    return `Недостаточный коэффициент контраста (${ratio.toFixed(2)}:1) для уровня WCAG ${levelLabel}`;
  }
  return `Insufficient color contrast ratio (${ratio.toFixed(2)}:1) for WCAG ${levelLabel} level`;
}

export function contrastHelp(locale: AppLocale, ratio: number, required: number): string {
  if (locale === 'ru') {
    return `Контрастность элемента ${ratio.toFixed(2)}:1, требуется ${required}:1`;
  }
  return `Element has contrast ratio ${ratio.toFixed(2)}:1, required ${required}:1`;
}

export function contrastFixSuggestions(
  locale: AppLocale,
  fg: string,
  bg: string,
  required: number,
): string[] {
  if (locale === 'ru') {
    return [
      `Увеличьте контраст между цветом текста (${fg}) и фоном (${bg})`,
      `Минимально требуемое соотношение: ${required}:1`,
    ];
  }
  return [
    `Increase contrast between text color (${fg}) and background color (${bg})`,
    `Minimum ratio required: ${required}:1`,
  ];
}

export function imageMissingAlt(locale: AppLocale): string {
  return locale === 'ru' ? 'У изображения нет атрибута alt' : 'Image missing alt attribute';
}

export function imageSuspiciousAlt(locale: AppLocale, alt: string): string {
  if (locale === 'ru') {
    return `Подозрительный (шаблонный) альтернативный текст изображения: «${alt}»`;
  }
  return `Image alt text is suspicious (generic): "${alt}"`;
}

export function imageHelpMeaningful(locale: AppLocale): string {
  return locale === 'ru'
    ? 'Укажите осмысленный alt, описывающий содержание изображения'
    : 'Provide a meaningful alt text that describes the image content';
}

export function imageHelpMissing(locale: AppLocale): string {
  return locale === 'ru'
    ? 'Добавьте атрибут alt: <img src="..." alt="описание">'
    : 'Add alt attribute: <img src="..." alt="description">';
}

export function imageFixMeaningful(locale: AppLocale): string[] {
  return locale === 'ru'
    ? ['Замените шаблонный alt на содержательное описание']
    : ['Replace generic alt text with a meaningful description'];
}

export function imageFixMissing(locale: AppLocale): string[] {
  return locale === 'ru'
    ? ['Добавьте описательный альтернативный текст', 'Для декоративных изображений используйте alt=""']
    : ['Add descriptive alt text', 'For decorative images, use alt=""'];
}

/** Lowercase values for matching alt text */
export function genericAltTokens(locale: AppLocale): string[] {
  const en = ['image', 'photo', 'picture', 'img', 'icon', 'graphic', 'logo', 'banner', 'untitled'];
  if (locale === 'ru') {
    return [...en, 'изображение', 'фото', 'картинка', 'иконка', 'логотип', 'баннер', 'без названия'];
  }
  return en;
}

export function missingTitleDescription(locale: AppLocale): string {
  return locale === 'ru' ? 'На странице отсутствует элемент <title>' : 'Page is missing a <title> element';
}

export function missingTitleHelp(locale: AppLocale): string {
  return locale === 'ru' ? 'У каждой страницы должен быть описательный заголовок' : 'Every page should have a descriptive title';
}

export function missingTitleFix(locale: AppLocale): string[] {
  return locale === 'ru' ? ['Добавьте элемент <title> внутрь <head>'] : ['Add a <title> element inside <head>'];
}

export function missingH1Description(locale: AppLocale): string {
  return locale === 'ru' ? 'На странице нет заголовка H1' : 'Page is missing an H1 heading';
}

export function missingH1Help(locale: AppLocale): string {
  return locale === 'ru' ? 'На странице должен быть ровно один заголовок H1' : 'Pages should have exactly one H1 heading';
}

export function missingH1Fix(locale: AppLocale): string[] {
  return locale === 'ru'
    ? ['Добавьте H1, отражающий тему страницы']
    : ['Add an H1 heading that describes the page content'];
}

export function multipleH1Description(locale: AppLocale, count: number): string {
  return locale === 'ru'
    ? `На странице ${count} заголовков H1 (ожидается 1)`
    : `Page has ${count} H1 headings (expected 1)`;
}

export function multipleH1Help(locale: AppLocale): string {
  return locale === 'ru'
    ? 'Рекомендуется один H1 на страницу'
    : 'Best practice is to have a single H1 per page';
}

export function multipleH1Fix(locale: AppLocale): string[] {
  return locale === 'ru'
    ? ['Оставьте один H1, для подразделов используйте H2 и ниже']
    : ['Consolidate to a single H1 and use H2+ for subsections'];
}

export function headingSkipDescription(locale: AppLocale, from: number, to: number): string {
  return locale === 'ru'
    ? `Уровень заголовка перескакивает с H${from} на H${to}`
    : `Heading level jumps from H${from} to H${to}`;
}

export function headingSkipHelp(locale: AppLocale): string {
  return locale === 'ru'
    ? 'Уровни заголовков должны увеличиваться по одному шагу'
    : 'Heading levels should increase by one at a time';
}

export function headingSkipFix(locale: AppLocale, previousLevel: number): string[] {
  return locale === 'ru'
    ? [`Измените на H${previousLevel + 1} или добавьте промежуточный заголовок`]
    : [`Change to H${previousLevel + 1} or add intermediate heading`];
}

export function missingLandmarkDescription(locale: AppLocale, role: string): string {
  return locale === 'ru' ? `Отсутствует ориентир (landmark): ${role}` : `Missing landmark: ${role}`;
}

export function missingLandmarkHelp(locale: AppLocale, tag: string, role: string): string {
  return locale === 'ru'
    ? `Добавьте элемент <${tag}> или атрибут role="${role}"`
    : `Add a <${tag}> element or role="${role}" attribute`;
}

export function missingLandmarkFix(locale: AppLocale, tag: string, role: string): string[] {
  return locale === 'ru'
    ? [`Добавьте <${tag}> или элемент с role="${role}"`]
    : [`Add <${tag}> element or an element with role="${role}"`];
}

export function formLabelDescription(locale: AppLocale): string {
  return locale === 'ru' ? 'У поля формы нет связанной подписи (label)' : 'Form input missing associated label';
}

export function formLabelHelp(locale: AppLocale): string {
  return locale === 'ru' ? 'У каждого поля ввода должна быть подпись' : 'All form inputs should have a label';
}

export function formLabelFix(locale: AppLocale): string[] {
  return locale === 'ru'
    ? ['Добавьте <label for="idПоля">Текст</label>', 'Или используйте aria-label']
    : ['Add <label for="inputId">Label</label>', 'Or use aria-label attribute'];
}

export function keyboardNotAccessibleDescription(locale: AppLocale): string {
  return locale === 'ru'
    ? 'Интерактивный элемент недоступен с клавиатуры'
    : 'Interactive element is not keyboard accessible';
}

export function keyboardTabIndexDescription(locale: AppLocale): string {
  return locale === 'ru'
    ? 'У элемента положительный tabindex (нарушает порядок фокуса)'
    : 'Element has positive tabindex (disrupts tab order)';
}

export function keyboardNoFocusDescription(locale: AppLocale): string {
  return locale === 'ru' ? 'У элемента нет видимого индикатора фокуса' : 'Element missing visible focus indicator';
}

export function keyboardGenericDescription(locale: AppLocale): string {
  return locale === 'ru' ? 'Обнаружена проблема доступности с клавиатуры' : 'Keyboard accessibility issue detected';
}

export function keyboardHelpNotAccessible(locale: AppLocale): string {
  return locale === 'ru'
    ? 'Добавьте tabindex="0" или используйте семантический интерактивный элемент'
    : 'Add tabindex="0" or use a semantic interactive element';
}

export function keyboardHelpTabIndex(locale: AppLocale): string {
  return locale === 'ru' ? 'Избегайте положительных значений tabindex' : 'Avoid positive tabindex values';
}

export function keyboardHelpFocus(locale: AppLocale): string {
  return locale === 'ru'
    ? 'Добавьте видимый стиль :focus (outline, рамку и т.д.)'
    : 'Add a visible :focus style (outline, border, etc.)';
}

export function keyboardHelpGeneric(locale: AppLocale): string {
  return locale === 'ru'
    ? 'Обеспечьте полную доступность элемента с клавиатуры'
    : 'Ensure element is fully keyboard accessible';
}

export function keyboardSuggestFocusable(locale: AppLocale): string[] {
  return locale === 'ru'
    ? ['Добавьте tabindex="0", чтобы элемент получал фокус', 'Или используйте <button> / <a> вместо <div> с onclick']
    : ['Add tabindex="0" to make element focusable', 'Or use <button> / <a> instead of <div> with onclick'];
}

export function keyboardSuggestTabIndex(locale: AppLocale): string[] {
  return locale === 'ru'
    ? ['Замените положительный tabindex на tabindex="0"']
    : ['Replace positive tabindex with tabindex="0"'];
}

export function keyboardSuggestFocusStyle(locale: AppLocale): string[] {
  return locale === 'ru'
    ? ['Добавьте CSS: элемент:focus { outline: 2px solid #667eea; }']
    : ['Add CSS: element:focus { outline: 2px solid #667eea; }'];
}
