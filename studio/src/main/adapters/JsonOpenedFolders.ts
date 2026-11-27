import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import type { OpenedFolders } from '../ports/ProjectDisk.ts';

const SCHEMA = z.object({ opened: z.array(z.string().min(1)) });

/** `projects.json` in the Studio's userData: the project folders opened from outside the projects folder. */
export class JsonOpenedFolders implements OpenedFolders {
  readonly #file: string;

  constructor(file: string) {
    this.#file = file;
  }

  async read(): Promise<readonly string[]> {
    const text = await readFile(this.#file, 'utf8').catch(() => '');
    const parsed = SCHEMA.safeParse(this.#json(text));
    return parsed.success ? parsed.data.opened : [];
  }

  async write(folders: readonly string[]): Promise<void> {
    const draft = `${this.#file}.${randomUUID()}.tmp`;
    await mkdir(dirname(this.#file), { recursive: true });
    await writeFile(draft, `${JSON.stringify({ opened: folders }, null, 2)}\n`);
    await rename(draft, this.#file);
  }

  #json(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
