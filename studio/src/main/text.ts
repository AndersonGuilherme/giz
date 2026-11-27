import { DEFAULT_LANGUAGE, translator, type InterfaceLanguage, type Translate } from '../shared/i18n/translate.ts';

// The interface language of the main process: pt-BR until the saved settings (or the wizard) choose another.
let current: InterfaceLanguage = DEFAULT_LANGUAGE;
const listeners: Array<(language: InterfaceLanguage) => void> = [];

export const interfaceLanguage = (): InterfaceLanguage => current;

/** Changes the language of the main process texts (and tells the listeners, such as zod's messages). */
export function setInterfaceLanguage(language: InterfaceLanguage): void {
  current = language;
  listeners.forEach((listener) => listener(language));
}

/** Calls `listener` now and on every language change. */
export function onInterfaceLanguage(listener: (language: InterfaceLanguage) => void): void {
  listeners.push(listener);
  listener(current);
}

/** The main process texts (dialog titles, error messages), from the same translation files as the window. */
export const translate: Translate = (key, values) => translator(current)(key, values);
