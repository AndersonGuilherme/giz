import { translate } from '../../text.ts';
import { StudioError } from '../StudioError.ts';

const isAbort = (error: unknown, signal: AbortSignal) => signal.aborted || (error instanceof Error && error.name === 'AbortError');

// A cancel answers at once: a call already in flight is left to finish on its own; core saves nothing after the abort.
function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  const aborted = new Promise<never>((_done, fail) => signal.addEventListener('abort', () => fail(signal.reason), { once: true }));
  return Promise.race([work, aborted]);
}

/** One long job at a time (making images, making voices): a second one is `busy`; `cancel` ends it as `cancelled`. */
export class OneJob {
  #running: AbortController | undefined;

  async run<T>(work: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (this.#running) throw new StudioError('busy', translate('media.busy'));
    const controller = new AbortController();
    this.#running = controller;
    try {
      return await untilAborted(work(controller.signal), controller.signal);
    } catch (error) {
      throw isAbort(error, controller.signal) ? new StudioError('cancelled', translate('media.cancelled')) : error;
    } finally {
      this.#running = undefined;
    }
  }

  cancel(): boolean {
    this.#running?.abort();
    return this.#running !== undefined;
  }
}
