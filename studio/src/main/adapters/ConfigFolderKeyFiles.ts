import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { KeyProvider } from '../../shared/accounts.ts';
import type { KeyFiles } from '../ports/KeyFiles.ts';

const missing = (error: NodeJS.ErrnoException) => {
  if (error.code === 'ENOENT') return undefined;
  throw error;
};

/**
 * <folder>/<service>.key (the CLI's ~/.config/gizzycera), each file mode 600. A key is written whole to a new 600 draft and
 * renamed over the old file, so it is never readable by others, not even for a moment. The folder is made 700 only
 * when the Studio creates it; an existing one is the person's and is left alone (with a warning when others can read it).
 */
export class ConfigFolderKeyFiles implements KeyFiles {
  readonly #folder: string;
  readonly #warn: (message: string) => void;

  constructor(folder: string, warn: (message: string) => void = console.warn) {
    this.#folder = folder;
    this.#warn = warn;
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
    await this.#ensureFolder();
    const draft = `${this.#file(provider)}.${randomUUID()}.tmp`;
    await writeFile(draft, `${key}\n`, { mode: 0o600, flag: 'wx' });
    await rename(draft, this.#file(provider));
  }

  async remove(provider: KeyProvider): Promise<boolean> {
    const existed = (await readFile(this.#file(provider)).catch(missing)) !== undefined;
    await rm(this.#file(provider), { force: true });
    return existed;
  }

  async #ensureFolder(): Promise<void> {
    const existing = await stat(this.#folder).catch(missing);
    if (!existing) return void (await mkdir(this.#folder, { recursive: true, mode: 0o700 }));
    if ((existing.mode & 0o077) !== 0) this.#warn(`AVISO: outras pessoas deste computador podem listar ${this.#folder} (as chaves ficam com permissão 600)`);
  }

  #file(provider: KeyProvider): string {
    return join(this.#folder, `${provider}.key`);
  }
}
