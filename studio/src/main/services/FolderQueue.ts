/**
 * The writes of each project folder, one after the other (the newest always lands last): the script editor's saves and
 * the Cast, Scenarios and Voices stages share one queue, so two of them never rewrite project.json or script.json at
 * the same time. A write must not ask the same queue for its folder again (it would wait for itself).
 */
export class FolderQueue {
  readonly #queues = new Map<string, Promise<unknown>>();

  run<T>(folder: string, write: () => Promise<T>): Promise<T> {
    const run = (this.#queues.get(folder) ?? Promise.resolve()).then(write);
    const settled = run.catch(() => undefined);
    this.#queues.set(folder, settled);
    void settled.then(() => (this.#queues.get(folder) === settled ? this.#queues.delete(folder) : undefined));
    return run;
  }

  /** Waits for every write in flight, of every folder (the app waits for them before it quits). */
  async settled(): Promise<void> {
    await Promise.all([...this.#queues.values()]);
  }
}
