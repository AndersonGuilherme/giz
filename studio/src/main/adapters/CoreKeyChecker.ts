import type { KeyCheck, KeyProvider } from '../../shared/accounts.ts';
import type { KeyChecker } from '../ports/KeyChecker.ts';
import { translate } from '../text.ts';
import { coreText } from './coreModules.ts';

// The text services core can check with one tiny call (an OpenAI or Gemini key serves their images too).
const CHECKABLE = ['anthropic', 'openai', 'gemini'] as const;
type Checkable = (typeof CHECKABLE)[number];
const isCheckable = (provider: KeyProvider): provider is Checkable => (CHECKABLE as readonly string[]).includes(provider);

// The same smallest real call as `giz keys test`: a few tokens in and out (a fraction of a cent).
const PING = { system: 'Reply with the single word: ok', prompt: 'ok', maxTokens: 64 };

/** core's single-attempt key check, given only this one key (never the CLI's environment). */
export class CoreKeyChecker implements KeyChecker {
  readonly #fetch: typeof fetch | undefined;

  /** `send`: another HTTP client (tests); by default core's. */
  constructor(send?: typeof fetch) {
    this.#fetch = send;
  }

  supports(provider: KeyProvider): boolean {
    return isCheckable(provider);
  }

  async check(provider: KeyProvider, key: string): Promise<KeyCheck> {
    if (!isCheckable(provider)) throw new Error(`no check for ${provider}`);
    const keys = { get: (service: string) => (service === provider ? key : undefined), hint: () => translate('keys.hint') };
    const overrides = this.#fetch ? { keys, fetch: this.#fetch } : { keys };
    const checker = (await coreText()).keyCheckProviderOf(provider, overrides);
    const { usage } = await checker.generate(PING);
    return { model: checker.model(), ...usage };
  }
}
