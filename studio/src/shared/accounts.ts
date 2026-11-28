// The AI accounts: one key per service (an OpenAI key serves both text and images).

/** The AI and voice services whose keys the Studio keeps; the names are core's (`gizzy keys`, ~/.config/gizzycera/<name>.key). */
export const KEY_PROVIDERS = ['anthropic', 'openai', 'gemini', 'fal', 'elevenlabs', 'fish'] as const;
export type KeyProvider = (typeof KEY_PROVIDERS)[number];

/** `keychain`: encrypted by the system (safeStorage); `file`: ~/.config/gizzycera/<service>.key, readable only by this user. */
export type KeyStorage = 'keychain' | 'file';

/**
 * `secure`: the system keychain is available; `fileFolder`: where keys go without it; `testable`: the services whose key
 * can be checked with a tiny call (the text ones). Never a key value.
 */
export type KeysStatus = Readonly<{ secure: boolean; fileFolder: string; testable: readonly KeyProvider[]; keys: Readonly<Record<KeyProvider, KeyStorage | null>> }>;

/** The answer of one tiny real call made with the key. */
export type KeyCheck = Readonly<{ model: string; inputTokens: number; outputTokens: number }>;
