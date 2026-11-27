import type { Result } from '../../shared/contract.ts';

/** `saved`: what is on disk is what is shown; `pending`: a change waits for the typing to stop; `saving`: on its way. */
export type SaveStatus = 'saved' | 'pending' | 'saving' | 'failed';
export type DraftAnswer<Report> = Readonly<{ status: SaveStatus; result?: Result<Report> }>;

type Timers = Readonly<{ set: (run: () => void, milliseconds: number) => unknown; clear: (timer: unknown) => void }>;
type Options<Value, Report> = Readonly<{
  send: (value: Value) => Promise<Result<Report>>;
  /** What is on disk when the editor opens (it is not saved again). */
  saved: Value;
  onAnswer: (answer: DraftAnswer<Report>) => void;
  delay: number;
  timers?: Timers;
}>;

const REAL_TIMERS: Timers = { set: (run, milliseconds) => setTimeout(run, milliseconds), clear: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>) };

/**
 * Saves a draft (the script, a character) a moment after it stops changing, one save after the other (a save waits for
 * the one in flight, so the newest version always lands last); only the answer of the newest save is shown. `flush`
 * sends what is pending now (leaving the editor, closing the window) and resolves when everything sent has landed.
 */
export class DraftSaver<Value, Report> {
  readonly #options: Options<Value, Report>;
  #saved: Value;
  #pending: Value | null = null;
  #timer: unknown;
  #chain: Promise<unknown> = Promise.resolve();
  #sent = 0;
  #landed = 0;
  // The last answer that came back, and the last version known to be on disk (a failed save never counts).
  #last: Result<Report> | undefined;
  #onDisk: Value;

  constructor(options: Options<Value, Report>) {
    this.#options = options;
    this.#saved = options.saved;
    this.#onDisk = options.saved;
  }

  change(value: Value): void {
    const { timers = REAL_TIMERS, delay, onAnswer } = this.#options;
    timers.clear(this.#timer);
    const waiting = this.#pending !== null;
    this.#pending = value === this.#saved ? null : value;
    // Taken back to what was sent last (an undo before the delay): nothing to send, and the last answer shown again.
    if (this.#pending === null) return void (waiting && onAnswer(this.#settled()));
    onAnswer({ status: 'pending' });
    this.#timer = timers.set(() => void this.#send(), delay);
  }

  hasPending(): boolean {
    return this.#pending !== null;
  }

  flush(): Promise<void> {
    (this.#options.timers ?? REAL_TIMERS).clear(this.#timer);
    if (this.#pending !== null) void this.#send();
    return this.#chain.then(() => undefined);
  }

  // With nothing waiting: the last save still on its way, or the last answer (a failure stays a failure).
  #settled(): DraftAnswer<Report> {
    if (this.#landed < this.#sent) return { status: 'saving' };
    const status: SaveStatus = this.#last?.ok === false ? 'failed' : 'saved';
    return this.#last ? { status, result: this.#last } : { status };
  }

  #send(): Promise<unknown> {
    const value = this.#pending;
    if (value === null) return this.#chain;
    this.#pending = null;
    this.#saved = value;
    const number = ++this.#sent;
    this.#options.onAnswer({ status: 'saving' });
    this.#chain = this.#chain.then(() => this.#options.send(value)).then((result) => this.#answered(number, value, result));
    return this.#chain;
  }

  #answered(number: number, value: Value, result: Result<Report>): void {
    this.#landed = number;
    this.#last = result;
    if (result.ok) this.#onDisk = value;
    if (number !== this.#sent) return;
    // A failed save: what it carried is not on disk, so the same version typed again is sent again.
    if (!result.ok) this.#saved = this.#onDisk;
    const status = this.#pending !== null ? 'pending' : result.ok ? 'saved' : 'failed';
    this.#options.onAnswer({ status, result });
  }
}
