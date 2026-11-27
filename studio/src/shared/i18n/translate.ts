import portugueseBase from './pt-BR.json' with { type: 'json' };
import englishBase from './en.json' with { type: 'json' };
import portugueseScript from './script.pt-BR.json' with { type: 'json' };
import englishScript from './script.en.json' with { type: 'json' };
import portugueseMedia from './media.pt-BR.json' with { type: 'json' };
import englishMedia from './media.en.json' with { type: 'json' };

// One file per area (the first run and Settings; the projects, the idea and the script; the cast, scenarios and voices), merged per language.
const portuguese = { ...portugueseBase, ...portugueseScript, ...portugueseMedia };
const english = { ...englishBase, ...englishScript, ...englishMedia };

/** The interface languages; pt-BR is the default until Settings (S2) lets the person choose. */
export type InterfaceLanguage = 'pt-BR' | 'en';
export type MessageKey = keyof typeof portuguese;
// A text with plural forms has `<key>.one` and `<key>.other` (and may have `<key>.zero`): it is asked by `<key>`.
type PluralBase<Key> = Key extends `${infer Base}.other` ? Base : never;
export type PluralKey = PluralBase<MessageKey>;
export type Translate = (key: MessageKey | PluralKey, values?: Readonly<Record<string, string | number>>) => string;

// English must have every key Portuguese has: the type check fails otherwise.
const MESSAGES: Readonly<Record<InterfaceLanguage, Readonly<Record<MessageKey, string>>>> = { 'pt-BR': portuguese, en: english };

export const DEFAULT_LANGUAGE: InterfaceLanguage = 'pt-BR';

type Language = Readonly<{ messages: Readonly<Record<string, string>>; rules: Intl.PluralRules }>;

// A plural key's form for `count` (the language's rules; `zero` when the text has one), else the key's own text.
function textOf({ messages, rules }: Language, key: string, count: unknown): string {
  if (Object.hasOwn(messages, key)) return messages[key]!;
  const amount = Number(count ?? 0);
  const forms = [amount === 0 ? `${key}.zero` : '', `${key}.${rules.select(amount)}`, `${key}.other`];
  return forms.map((form) => messages[form]).find((text) => text !== undefined) ?? key;
}

/** The translation function of a language: the text of a key (its plural form, by `count`) with each `{name}` replaced. */
export function translator(language: InterfaceLanguage = DEFAULT_LANGUAGE): Translate {
  const chosen: Language = { messages: MESSAGES[language], rules: new Intl.PluralRules(language) };
  return (key, values = {}) => textOf(chosen, key, values.count).replace(/\{(\w+)\}/g, (whole, name: string) => String(values[name] ?? whole));
}

/** Whether a key exists (a value from core's lists may have no label yet: then the value itself is shown). */
export function hasMessage(key: string): key is MessageKey {
  return Object.hasOwn(MESSAGES[DEFAULT_LANGUAGE], key);
}
