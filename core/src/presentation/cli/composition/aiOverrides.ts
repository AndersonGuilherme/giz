import type { KeyStore } from '../../../application/ports/KeyStore.ts';

/** What a caller (a test, the studio) may replace in the AI providers, text and image alike: the HTTP client and the keys. */
export type AiOverrides = Readonly<{ fetch?: typeof fetch; keys?: KeyStore }>;
