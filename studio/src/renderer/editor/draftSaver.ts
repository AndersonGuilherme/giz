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

  constructor(options: Options<Value, Report>) {
    this.#options = options;
    this.#saved = options.saved;
  }

  change(value: Value): void {
    const { timers = REAL_TIMERS, delay, onAnswer } = this.#options;
    timers.clear(this.#timer);
    const waiting = this.#pending !== null;
    this.#pending = value === this.#saved ? null : value;
    // Taken back to what was sent last (an undo before the delay): nothing to send, and no "pending" left behind.
    if (this.#pending === null) return void (waiting && onAnswer({ status: this.#settled() }));
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

  // What the status is with nothing waiting: the last save still on its way, or everything on disk.
  #settled(): SaveStatus {
    return this.#landed < this.#sent ? 'saving' : 'saved';
  }

  #send(): Promise<unknown> {
    const value = this.#pending;
    if (value === null) return this.#chain;
    this.#pending = null;
    this.#saved = value;
    const number = ++this.#sent;
    this.#options.onAnswer({ status: 'saving' });
    this.#chain = this.#chain.then(() => this.#options.send(value)).then((result) => this.#answered(number, result));
    return this.#chain;
  }

  #answered(number: number, result: Result<Report>): void {
    this.#landed = number;
    if (number !== this.#sent) return;
    const status = this.#pending !== null ? 'pending' : result.ok ? 'saved' : 'failed';
    this.#options.onAnswer({ status, result });
  }
}
