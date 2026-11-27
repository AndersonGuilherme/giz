import type { KeyCheck, KeyProvider } from '../../shared/accounts.ts';

/** Checks a key with one tiny real call to its service (core's single-attempt check). */
export interface KeyChecker {
  supports(provider: KeyProvider): boolean;
  check(provider: KeyProvider, key: string): Promise<KeyCheck>;
}
