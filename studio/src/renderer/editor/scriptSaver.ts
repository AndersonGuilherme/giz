import type { Result } from '../../shared/contract.ts';
import type { EditorReport, ScriptJson } from '../../shared/script.ts';

/** `saved`: what is on disk is what is shown; `pending`: a change waits for the typing to stop; `saving`: on its way. */
export type SaveStatus = 'saved' | 'pending' | 'saving' | 'failed';
export type SaveAnswer = Readonly<{ status: SaveStatus; result?: Result<EditorReport> }>;

type Timers = Readonly<{ set: (run: () => void, milliseconds: number) => unknown; clear: (timer: unknown) => void }>;
type Options = Readonly<{
  send: (script: ScriptJson) => Promise<Result<EditorReport>>;
  /** What is on disk when the editor opens (it is not saved again). */
  saved: ScriptJson;
  onAnswer: (answer: SaveAnswer) => void;
  delay: number;
  timers?: Timers;
}>;

const REAL_TIMERS: Timers = { set: (run, milliseconds) => setTimeout(run, milliseconds), clear: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>) };

/**
 * Saves the script a moment after it stops changing, one save after the other (a save waits for the one in flight, so
 * the newest version always lands last); only the answer of the newest save is shown. `flush` sends what is pending now
 * (leaving the editor, closing the window) and resolves when everything sent has landed.
 */
export class ScriptSaver {
  readonly #options: Options;
  #saved: ScriptJson;
  #pending: ScriptJson | null = null;
  #timer: unknown;
  #chain: Promise<unknown> = Promise.resolve();
  #sent = 0;

  constructor(options: Options) {
    this.#options = options;
    this.#saved = options.saved;
  }

  change(script: ScriptJson): void {
    const { timers = REAL_TIMERS, delay, onAnswer } = this.#options;
    timers.clear(this.#timer);
    this.#pending = script === this.#saved ? null : script;
    if (this.#pending === null) return;
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

  #send(): Promise<unknown> {
    const script = this.#pending;
    if (script === null) return this.#chain;
    this.#pending = null;
    this.#saved = script;
    const number = ++this.#sent;
    this.#options.onAnswer({ status: 'saving' });
    this.#chain = this.#chain.then(() => this.#options.send(script)).then((result) => this.#answered(number, result));
    return this.#chain;
  }

  #answered(number: number, result: Result<EditorReport>): void {
    if (number !== this.#sent) return;
    const status = this.#pending !== null ? 'pending' : result.ok ? 'saved' : 'failed';
    this.#options.onAnswer({ status, result });
  }
}
