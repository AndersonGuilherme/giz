import { KEY_PROVIDERS, type KeyCheck, type KeyProvider, type KeysStatus, type KeyStorage } from '../../shared/accounts.ts';
import { translate } from '../text.ts';
import { StudioError } from './StudioError.ts';
import type { KeyChecker } from '../ports/KeyChecker.ts';
import type { KeyFiles } from '../ports/KeyFiles.ts';
import type { Cipher, KeyVault } from '../ports/KeyVault.ts';

type Dependencies = Readonly<{ cipher: Cipher; vault: KeyVault; files: KeyFiles; checker: KeyChecker }>;

/**
 * Keeps the AI service keys: encrypted by the system keychain (safeStorage) when there is one, otherwise in the
 * CLI's 600-mode file (ruling S2: the screen says so). A key goes in and never comes back out to the window: no
 * answer carries it and it is never logged; only `test` reads it, to hand it to the service check.
 */
export class KeyService {
  readonly #dependencies: Dependencies;
  // The read-modify-writes run one after the other: two keys set at once must not overwrite each other.
  #queue: Promise<unknown> = Promise.resolve();

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  set(provider: KeyProvider, key: string): Promise<KeyStorage> {
    return this.#exclusive(() => this.#store(provider, key.trim()));
  }

  async has(provider: KeyProvider): Promise<boolean> {
    return (await this.#storageOf(provider)) !== null;
  }

  remove(provider: KeyProvider): Promise<boolean> {
    return this.#exclusive(() => this.#forget(provider));
  }

  async status(): Promise<KeysStatus> {
    const { cipher, files, checker } = this.#dependencies;
    const storages = await Promise.all(KEY_PROVIDERS.map(async (provider) => [provider, await this.#storageOf(provider)] as const));
    const testable = KEY_PROVIDERS.filter((provider) => checker.supports(provider));
    return { secure: cipher.available(), fileFolder: files.folder(), testable, keys: Object.fromEntries(storages) as KeysStatus['keys'] };
  }

  async test(provider: KeyProvider): Promise<KeyCheck> {
    const { checker } = this.#dependencies;
    if (!checker.supports(provider)) throw new StudioError('unavailable', translate('errors.noKeyCheck'));
    const key = await this.#read(provider);
    if (key === undefined) throw new StudioError('invalid-request', translate('errors.noKey'));
    // core's message is already readable (and never carries the key): it is what the person sees.
    return checker.check(provider, key).catch((error: unknown) => {
      throw new StudioError('failed', error instanceof Error ? error.message : String(error));
    });
  }

  #exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = this.#queue.then(task);
    this.#queue = run.catch(() => undefined);
    return run;
  }

  async #store(provider: KeyProvider, key: string): Promise<KeyStorage> {
    const { cipher, vault, files } = this.#dependencies;
    if (!cipher.available()) return files.write(provider, key).then(() => 'file');
    const keys = await vault.read();
    await vault.write({ ...keys, [provider]: cipher.encrypt(key) });
    return 'keychain';
  }

  async #storageOf(provider: KeyProvider): Promise<KeyStorage | null> {
    const { vault, files } = this.#dependencies;
    if (Object.hasOwn(await vault.read(), provider)) return 'keychain';
    return (await files.read(provider)) === undefined ? null : 'file';
  }

  // The keychain first (decrypted only when the system can), then the CLI file.
  async #read(provider: KeyProvider): Promise<string | undefined> {
    const { cipher, vault, files } = this.#dependencies;
    const sealed = (await vault.read())[provider];
    if (sealed !== undefined && cipher.available()) return cipher.decrypt(sealed);
    return files.read(provider);
  }

  // Forgets the key wherever the Studio sees it: the keychain vault and the CLI file.
  async #forget(provider: KeyProvider): Promise<boolean> {
    const { vault, files } = this.#dependencies;
    const keys = await vault.read();
    const sealed = Object.hasOwn(keys, provider);
    if (sealed) await vault.write(Object.fromEntries(Object.entries(keys).filter(([name]) => name !== provider)));
    const filed = await files.remove(provider);
    return sealed || filed;
  }
}
