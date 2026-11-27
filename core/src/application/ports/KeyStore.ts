import type { TextProviderName } from '../../domain/ai/TextProviderName.ts';

/** Every paid service that needs the person's own key. */
export type KeyedService = TextProviderName | 'elevenlabs' | 'fish';
export const KEYED_SERVICES: readonly KeyedService[] = ['anthropic', 'openai', 'gemini', 'elevenlabs', 'fish'];

/** Where the keys live (the CLI: environment or ~/.config/giz; the studio: encrypted storage). Never logs them. */
export interface KeyStore {
  /** The key, or undefined when there is none; it never throws. */
  get(service: KeyedService): string | undefined;
  /** How the person adds the key, in pt-BR (for the "key not found" message). */
  hint(service: KeyedService): string;
}
