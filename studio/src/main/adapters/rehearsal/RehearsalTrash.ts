import { mkdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import type { Trash } from '../../ports/ProjectDisk.ts';
import { trashedName } from '../DiskProjects.ts';

/** The rehearsal trash: a folder inside the isolated Studio home, so a rehearsal never fills the system trash. */
export class RehearsalTrash implements Trash {
  readonly #folder: string;

  constructor(folder: string) {
    this.#folder = folder;
  }

  async trash(folder: string): Promise<void> {
    await mkdir(this.#folder, { recursive: true });
    await rename(folder, join(this.#folder, trashedName(folder)));
  }
}
