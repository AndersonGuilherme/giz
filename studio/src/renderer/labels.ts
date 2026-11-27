import { hasMessage, type Translate } from '../shared/i18n/translate.ts';

/** The label of a value from core's lists (`pose.explain` → "Explicar"); the value itself when it has none yet. */
export function labelOf(translate: Translate, group: string, value: string): string {
  const key = `${group}.${value}`;
  return hasMessage(key) ? translate(key) : value;
}
