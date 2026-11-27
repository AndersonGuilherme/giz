import type { KeyProvider } from '../shared/accounts.ts';
import { hasMessage, type Translate } from '../shared/i18n/translate.ts';
import { SERVICES } from './components/setup/providers.ts';

/** The label of a value from core's lists (`pose.explain` → "Explicar"); the value itself when it has none yet. */
export function labelOf(translate: Translate, group: string, value: string): string {
  const key = `${group}.${value}`;
  return hasMessage(key) ? translate(key) : value;
}

/** A text, image or voice service as the person knows it (brand names are not translated). */
export const serviceName = (provider: string): string => (Object.hasOwn(SERVICES, provider) ? SERVICES[provider as KeyProvider].name : provider);
