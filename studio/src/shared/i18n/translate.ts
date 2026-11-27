import portugueseBase from './pt-BR.json' with { type: 'json' };
import englishBase from './en.json' with { type: 'json' };
import portugueseScript from './script.pt-BR.json' with { type: 'json' };
import englishScript from './script.en.json' with { type: 'json' };

// One file per area (the first run and Settings; the projects, the idea and the script), merged per language.
const portuguese = { ...portugueseBase, ...portugueseScript };
const english = { ...englishBase, ...englishScript };

/** The interface languages; pt-BR is the default until Settings (S2) lets the person choose. */
export type InterfaceLanguage = 'pt-BR' | 'en';
export type MessageKey = keyof typeof portuguese;
export type Translate = (key: MessageKey, values?: Readonly<Record<string, string | number>>) => string;

// English must have every key Portuguese has: the type check fails otherwise.
const MESSAGES: Readonly<Record<InterfaceLanguage, Readonly<Record<MessageKey, string>>>> = { 'pt-BR': portuguese, en: english };

export const DEFAULT_LANGUAGE: InterfaceLanguage = 'pt-BR';

/** The translation function of a language: the text of a key with each `{name}` replaced by its value. */
export function translator(language: InterfaceLanguage = DEFAULT_LANGUAGE): Translate {
  const messages = MESSAGES[language];
  return (key, values = {}) => messages[key].replace(/\{(\w+)\}/g, (whole, name: string) => String(values[name] ?? whole));
}

/** Whether a key exists (a value from core's lists may have no label yet: then the value itself is shown). */
export function hasMessage(key: string): key is MessageKey {
  return Object.hasOwn(MESSAGES[DEFAULT_LANGUAGE], key);
}
