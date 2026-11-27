import { resolve } from 'node:path';
import { reallyWithin } from '../../realPaths.ts';
import type { FolderGrants } from '../FolderGrants.ts';

/**
 * What the media scheme may serve: the granted project folders and the Studio's own media folders (the voice
 * samples), which are never granted, so no channel can open, check or write them as a project. Links never lead out.
 */
export class ServedFolders {
  readonly #grants: FolderGrants;
  readonly #own = new Set<string>();

  constructor(grants: FolderGrants) {
    this.#grants = grants;
  }

  /** Serves one of the Studio's own folders; answers it as an absolute path. */
  serve(folder: string): string {
    const path = resolve(folder);
    this.#own.add(path);
    return path;
  }

  allows(path: string): boolean {
    return this.#grants.allows(path) || [...this.#own].some((folder) => reallyWithin(folder, path));
  }
}
