import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { KeyProvider } from '../../shared/accounts.ts';
import type { KeyFiles } from '../ports/KeyFiles.ts';

const missing = (error: NodeJS.ErrnoException) => {
  if (error.code === 'ENOENT') return undefined;
  throw error;
};

/** <folder>/<service>.key (the CLI's ~/.config/giz): the folder only this user may enter, each file mode 600. */
export class ConfigFolderKeyFiles implements KeyFiles {
  readonly #folder: string;

  constructor(folder: string) {
    this.#folder = folder;
  }

  folder(): string {
    return this.#folder;
  }

  // A blank file is no key, as for the CLI.
  async read(provider: KeyProvider): Promise<string | undefined> {
    const text = await readFile(this.#file(provider), 'utf8').catch(missing);
    return text?.trim() || undefined;
  }

  async write(provider: KeyProvider, key: string): Promise<void> {
    await mkdir(this.#folder, { recursive: true, mode: 0o700 });
    await writeFile(this.#file(provider), `${key}\n`, { mode: 0o600 });
    // An older file keeps its mode on write: the key never stays readable by others.
    await chmod(this.#file(provider), 0o600);
  }

  async remove(provider: KeyProvider): Promise<boolean> {
    const existed = (await readFile(this.#file(provider)).catch(missing)) !== undefined;
    await rm(this.#file(provider), { force: true });
    return existed;
  }

  #file(provider: KeyProvider): string {
    return join(this.#folder, `${provider}.key`);
  }
}
