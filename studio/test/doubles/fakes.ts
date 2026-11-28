import { FolderGrants } from '../../src/main/services/FolderGrants.ts';
import type { Cipher, KeyVault, SealedKeys } from '../../src/main/ports/KeyVault.ts';

/** Reversible "encryption" that is visibly not the plain text. */
export class FakeCipher implements Cipher {
  readonly #available: boolean;

  constructor(available = true) {
    this.#available = available;
  }

  available(): boolean {
    return this.#available;
  }

  encrypt(text: string): string {
    return Buffer.from(`sealed:${text}`).toString('base64');
  }

  decrypt(sealed: string): string {
    return Buffer.from(sealed, 'base64').toString().replace(/^sealed:/, '');
  }
}

const later = (milliseconds: number) => new Promise((done) => setTimeout(done, milliseconds));

/** A vault in memory; `delay` makes reads and writes slow, so overlapping read-modify-writes would lose keys. */
export class InMemoryVault implements KeyVault {
  keys: SealedKeys = {};
  writes = 0;
  failNextWrite = false;
  readonly #delay: number;

  constructor(delay = 0) {
    this.#delay = delay;
  }

  async read(): Promise<SealedKeys> {
    await later(this.#delay);
    return this.keys;
  }

  async write(keys: SealedKeys): Promise<void> {
    await later(this.#delay);
    if (this.failNextWrite) {
      this.failNextWrite = false;
      throw new Error('disk full');
    }
    this.keys = keys;
    this.writes += 1;
  }
}

/** Grants for the folders the tests use. */
export function grantsFor(...folders: string[]): FolderGrants {
  const grants = new FolderGrants();
  folders.forEach((folder) => grants.grant(folder));
  return grants;
}
