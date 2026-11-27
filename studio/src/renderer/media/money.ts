import type { InterfaceLanguage, Translate } from '../../shared/i18n/translate.ts';
import { formatDollars } from '../format.ts';

/** The interface language, as the translation files name it. */
export const languageOf = (translate: Translate): InterfaceLanguage => (translate('media.language') === 'en' ? 'en' : 'pt-BR');

/** "até US$ 0,08", "grátis" or "desconhecido" (a price the tables do not have). */
export function costText(dollars: number | null, translate: Translate): string {
  if (dollars === null) return translate('media.costUnknown');
  if (dollars === 0) return translate('media.free');
  return translate('media.upTo', { cost: formatDollars(dollars, languageOf(translate)) });
}
