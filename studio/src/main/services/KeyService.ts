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

  /** The key for a call the main process makes itself (a script generation); never sent to the window. */
  keyOf(provider: KeyProvider): Promise<string | undefined> {
    return this.#read(provider);
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

  // The keychain first (decrypted only when the system can), then the CLI file. A key the keychain cannot open (sealed
  // by giz Estúdio, before the rename: the keychain item is named after the app) counts as missing.
  async #read(provider: KeyProvider): Promise<string | undefined> {
    const { cipher, vault, files } = this.#dependencies;
    const sealed = (await vault.read())[provider];
    const opened = sealed !== undefined && cipher.available() ? this.#opened(sealed) : undefined;
    return opened ?? files.read(provider);
  }

  #opened(sealed: string): string | undefined {
    try {
      return this.#dependencies.cipher.decrypt(sealed);
    } catch {
      return undefined;
    }
  }

  // Forgets the key where the Studio keeps it: the keychain vault, or (without a keychain) the file it wrote there. With
  // a keychain, a ~/.config/gizzycera file is the CLI's (the Studio never writes one then): it stays for the gizzy command.
  async #forget(provider: KeyProvider): Promise<boolean> {
    const { cipher, vault, files } = this.#dependencies;
    if (!cipher.available()) return files.remove(provider);
    const keys = await vault.read();
    if (!Object.hasOwn(keys, provider)) return false;
    await vault.write(Object.fromEntries(Object.entries(keys).filter(([name]) => name !== provider)));
    return true;
  }
}
