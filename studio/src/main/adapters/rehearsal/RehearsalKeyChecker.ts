import type { KeyCheck, KeyProvider } from '../../../shared/accounts.ts';
import type { KeyChecker } from '../../ports/KeyChecker.ts';

/** The rehearsal key check: a key with "ok" in it passes, any other is refused like a real 401; no network. */
export class RehearsalKeyChecker implements KeyChecker {
  supports(provider: KeyProvider): boolean {
    return ['anthropic', 'openai', 'gemini'].includes(provider);
  }

  async check(_provider: KeyProvider, key: string): Promise<KeyCheck> {
    if (!key.includes('ok')) throw new Error('Ensaio: a chave foi recusada (401): confira se ela está certa e ativa');
    return { model: 'modelo-de-ensaio', inputTokens: 11, outputTokens: 2 };
  }
}
