import { translate } from '../../text.ts';
import { StudioError } from '../StudioError.ts';

const isAbort = (error: unknown, signal: AbortSignal) => signal.aborted || (error instanceof Error && error.name === 'AbortError');

// A cancel answers at once; the work, told by its signal, stops the call in flight and the job ends when it really does.
function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  const aborted = new Promise<never>((_done, fail) => signal.addEventListener('abort', () => fail(signal.reason), { once: true }));
  return Promise.race([work, aborted]);
}

/**
 * One long job at a time (making images, making voices): a second one is `busy` until the first one's work has really
 * ended, even after a cancel (which answers at once as `cancelled`).
 */
export class OneJob {
  #running: Readonly<{ controller: AbortController; work: Promise<unknown> }> | undefined;

  async run<T>(work: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (this.#running) throw new StudioError('busy', translate('media.busy'));
    const controller = new AbortController();
    // The slot is freed before the caller hears the end: a job asked right after it never finds this one running.
    const finished = work(controller.signal).finally(() => (this.#running?.controller === controller ? (this.#running = undefined) : undefined));
    this.#running = { controller, work: finished.catch(() => undefined) };
    try {
      return await untilAborted(finished, controller.signal);
    } catch (error) {
      throw isAbort(error, controller.signal) ? new StudioError('cancelled', translate('media.cancelled')) : error;
    }
  }

  running(): boolean {
    return this.#running !== undefined;
  }

  /** Resolves when the job in flight (if any) has really ended. */
  async ended(): Promise<void> {
    await this.#running?.work;
  }

  cancel(): boolean {
    this.#running?.controller.abort();
    return this.#running !== undefined;
  }
}
