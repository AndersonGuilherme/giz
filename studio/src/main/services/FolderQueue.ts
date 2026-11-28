import { folderKeyOf as keyOf } from '../realPaths.ts';

// The same folder reached through a link is one queue (its real path); a path that cannot be resolved keeps its own.

/**
 * The writes of each project folder, one after the other (the newest always lands last): the script editor's saves and
 * the Cast, Scenarios and Voices stages share one queue, so two of them never rewrite project.json or script.json at
 * the same time. A write must not ask the same queue for its folder again (it would wait for itself).
 */
export class FolderQueue {
  readonly #queues = new Map<string, Promise<unknown>>();

  run<T>(folder: string, write: () => Promise<T>): Promise<T> {
    const key = keyOf(folder);
    const run = (this.#queues.get(key) ?? Promise.resolve()).then(write);
    const settled = run.catch(() => undefined);
    this.#queues.set(key, settled);
    void settled.then(() => (this.#queues.get(key) === settled ? this.#queues.delete(key) : undefined));
    return run;
  }

  /** Waits until no write is in flight, of any folder, including writes asked meanwhile (the app waits before quitting). */
  async settled(): Promise<void> {
    while (this.#queues.size > 0) await Promise.all([...this.#queues.values()]);
  }
}
