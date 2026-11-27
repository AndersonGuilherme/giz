import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { KeyVault, SealedKeys } from '../ports/KeyVault.ts';

// No file yet: no keys.
function noFileYet(error: unknown): string {
  if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '{}';
  throw error;
}

/** The encrypted keys in one JSON file only this user can read (written whole, then renamed into place). */
export class JsonKeyVault implements KeyVault {
  readonly #file: string;

  constructor(file: string) {
    this.#file = file;
  }

  async read(): Promise<SealedKeys> {
    const text = await readFile(this.#file, 'utf8').catch(noFileYet);
    return JSON.parse(text) as SealedKeys;
  }

  async write(keys: SealedKeys): Promise<void> {
    const draft = `${this.#file}.tmp`;
    await mkdir(dirname(this.#file), { recursive: true });
    await writeFile(draft, JSON.stringify(keys, null, 2), { mode: 0o600 });
    await rename(draft, this.#file);
  }
}
