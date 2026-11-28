import type { FolderPicker } from '../ports/FolderPicker.ts';
import type { FolderGrants } from './FolderGrants.ts';

/** `launchFolder`: the project folder given on the command line, if any (already granted by the composition). */
type Dependencies = Readonly<{ picker: FolderPicker; grants: FolderGrants; launchFolder: string | null }>;

/** The folders the person opens: picked in a dialog, or named on the command line (of this launch or a later one). */
export class ProjectService {
  readonly #dependencies: Dependencies;
  #launched: string | null;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
    this.#launched = dependencies.launchFolder;
  }

  /** The folder the person picks is granted: the window may open, check and render it from then on. */
  async pick(): Promise<string | null> {
    const { picker, grants } = this.#dependencies;
    const folder = await picker.pickFolder();
    return folder === null ? null : grants.grant(folder);
  }

  launched(): string | null {
    return this.#launched;
  }

  /** A second launch named this folder (the single-instance lock hands it over): granted, it is the one launched now. */
  relaunched(folder: string): string {
    this.#launched = this.#dependencies.grants.grant(folder);
    return this.#launched;
  }
}
