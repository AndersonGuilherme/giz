import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { KeyVault, SealedKeys } from '../ports/KeyVault.ts';
import { StudioError } from '../services/StudioError.ts';
import { translate } from '../text.ts';

const isPlainObject = (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The encrypted keys in one JSON file only this user can read (written whole to a unique draft, then renamed). */
export class JsonKeyVault implements KeyVault {
  readonly #file: string;

  constructor(file: string) {
    this.#file = file;
  }

  async read(): Promise<SealedKeys> {
    const text = await readFile(this.#file, 'utf8').catch((error: NodeJS.ErrnoException) => this.#noFileYet(error));
    const keys = this.#parsed(text);
    if (!isPlainObject(keys)) throw this.#unreadable(new Error('not a JSON object'));
    return keys as SealedKeys;
  }

  async write(keys: SealedKeys): Promise<void> {
    const draft = `${this.#file}.${randomUUID()}.tmp`;
    await mkdir(dirname(this.#file), { recursive: true });
    await writeFile(draft, JSON.stringify(keys, null, 2), { mode: 0o600 });
    await rename(draft, this.#file);
  }

  // No file yet: no keys. Any other failure: a readable error, the raw one in the details.
  #noFileYet(error: NodeJS.ErrnoException): string {
    if (error.code === 'ENOENT') return '{}';
    throw this.#unreadable(error);
  }

  #parsed(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw this.#unreadable(error);
    }
  }

  #unreadable(error: unknown): StudioError {
    return new StudioError('unavailable', translate('errors.vaultUnreadable', { file: this.#file }), [String((error as Error).message ?? error)]);
  }
}
