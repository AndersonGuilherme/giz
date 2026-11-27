import { resolve } from 'node:path';
import { translate } from '../text.ts';
import { StudioError } from './StudioError.ts';

/** The long jobs of a project folder: its render, and its voice and scenario generation. */
export type FolderJob = 'render' | 'voices' | 'scenarios';

// A render reads the voices and the scenario images: it never runs on a folder while they are being made, nor the other way.
const CLASHES: Readonly<Record<FolderJob, readonly FolderJob[]>> = { render: ['voices', 'scenarios'], voices: ['render'], scenarios: ['render'] };

const BUSY = { render: 'video.busy.render', voices: 'video.busy.voices', scenarios: 'video.busy.scenarios' } as const;

/** Which long jobs run on which project folder, so a job that clashes with one running there is refused as `busy`. */
export class FolderJobs {
  readonly #running: Array<Readonly<{ folder: string; job: FolderJob }>> = [];

  async run<T>(folder: string, job: FolderJob, work: () => Promise<T>): Promise<T> {
    const release = this.claim(folder, job);
    try {
      return await work();
    } finally {
      release();
    }
  }

  /** Takes the folder for `job` (refused as `busy` when it clashes with one running there); answers its release. */
  claim(folder: string, job: FolderJob): () => void {
    const entry = { folder: resolve(folder), job };
    const clash = this.#running.find((other) => other.folder === entry.folder && CLASHES[job].includes(other.job));
    if (clash) throw new StudioError('busy', translate(BUSY[clash.job]));
    this.#running.push(entry);
    // Released once: a second call finds nothing to remove.
    return () => {
      const index = this.#running.indexOf(entry);
      if (index >= 0) this.#running.splice(index, 1);
    };
  }
}
