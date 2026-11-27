import type { KeyProvider } from '../../../shared/accounts.ts';

type Use = 'accounts.text' | 'accounts.image' | 'accounts.voice';

/** The services as the person knows them (brand names are not translated) and what each key serves. */
export const SERVICES: Readonly<Record<KeyProvider, Readonly<{ name: string; uses: readonly Use[] }>>> = {
  anthropic: { name: 'Anthropic (Claude)', uses: ['accounts.text'] },
  openai: { name: 'OpenAI', uses: ['accounts.text', 'accounts.image'] },
  gemini: { name: 'Google Gemini', uses: ['accounts.text', 'accounts.image'] },
  fal: { name: 'fal.ai (Flux)', uses: ['accounts.image'] },
  elevenlabs: { name: 'ElevenLabs', uses: ['accounts.voice'] },
  fish: { name: 'Fish Audio', uses: ['accounts.voice'] },
};

/** The name of a provider choice (the local voice is not a keyed service). */
export const providerName = (provider: KeyProvider | 'qwen'): string => (provider === 'qwen' ? '' : SERVICES[provider].name);
