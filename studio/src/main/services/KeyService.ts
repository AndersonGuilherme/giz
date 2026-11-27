import type { KeyProvider } from '../../shared/contract.ts';
import { translate } from '../text.ts';
import { StudioError } from './StudioError.ts';
import type { Cipher, KeyVault } from '../ports/KeyVault.ts';

type Dependencies = Readonly<{ cipher: Cipher; vault: KeyVault }>;

/**
 * Keeps the AI service keys encrypted at rest. A key goes in and never comes back out to the window: there is no
 * method that returns it, and it is never logged.
 */
export class KeyService {
  readonly #dependencies: Dependencies;
  // The read-modify-writes run one after the other: two keys set at once must not overwrite each other.
  #queue: Promise<unknown> = Promise.resolve();

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  set(provider: KeyProvider, key: string): Promise<true> {
    return this.#exclusive(() => this.#seal(provider, key));
  }

  async has(provider: KeyProvider): Promise<boolean> {
    return Object.hasOwn(await this.#dependencies.vault.read(), provider);
  }

  remove(provider: KeyProvider): Promise<boolean> {
    return this.#exclusive(() => this.#forget(provider));
  }

  #exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = this.#queue.then(task);
    this.#queue = run.catch(() => undefined);
    return run;
  }

  async #seal(provider: KeyProvider, key: string): Promise<true> {
    const { cipher, vault } = this.#dependencies;
    if (!cipher.available()) throw new StudioError('unavailable', translate('errors.noVault'));
    const keys = await vault.read();
    await vault.write({ ...keys, [provider]: cipher.encrypt(key) });
    return true;
  }

  async #forget(provider: KeyProvider): Promise<boolean> {
    const { vault } = this.#dependencies;
    const keys = await vault.read();
    if (!Object.hasOwn(keys, provider)) return false;
    await vault.write(Object.fromEntries(Object.entries(keys).filter(([name]) => name !== provider)));
    return true;
  }
}
