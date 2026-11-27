import { DEFAULT_LANGUAGE, translator } from '../shared/i18n/translate.ts';

/** The interface language of the main process (fixed until Settings, in S2, lets the person choose). */
export const INTERFACE_LANGUAGE = DEFAULT_LANGUAGE;

/** The main process texts (dialog titles, error messages), from the same translation files as the window. */
export const translate = translator(INTERFACE_LANGUAGE);
