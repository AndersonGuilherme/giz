import { resolve } from 'node:path';
import { isWithin, reallyWithin } from '../realPaths.ts';
import { translate } from '../text.ts';
import { StudioError } from './StudioError.ts';

/**
 * The folders the person gave the Studio (the folder picker, `--project`, later the projects root). The window can
 * only open, check or render inside one of them: a compromised page cannot point core at any folder of the disk.
 */
export class FolderGrants {
  readonly #folders = new Set<string>();

  grant(folder: string): string {
    const path = resolve(folder);
    this.#folders.add(path);
    return path;
  }

  /** Whether the path is really inside a granted folder, links resolved (a link never leads out of it). */
  allows(path: string): boolean {
    return [...this.#folders].some((granted) => reallyWithin(granted, path));
  }

  /** The folder as an absolute path, when it is inside a granted one; otherwise an `invalid-request` error. */
  require(folder: string): string {
    const path = resolve(folder);
    if ([...this.#folders].some((granted) => isWithin(granted, path))) return path;
    throw new StudioError('invalid-request', translate('errors.folderNotGranted', { folder: path }));
  }
}
