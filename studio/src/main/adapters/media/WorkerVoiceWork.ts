import type { SampleVoice, SpokenSample, VoiceJob } from '../../ports/MediaCore.ts';
import type { SampleRequest, VoiceWork } from '../../ports/VoiceWork.ts';
import { interfaceLanguage, translate } from '../../text.ts';
import { fromVoiceWorker, type FromVoiceWorker, type ToVoiceWorker } from '../../worker/voiceMessages.ts';

/** The voice worker's process as the runner sees it (a utility process; a fake one in tests). */
export interface VoiceChannel {
  send(message: ToVoiceWorker): void;
  onMessage(listener: (message: unknown) => void): void;
  onExit(listener: (code: number) => void): void;
  kill(): void;
}

type Pending = Readonly<{ resolve: (sample?: SpokenSample) => void; reject: (error: unknown) => void; job?: VoiceJob }>;
type Asked = Readonly<{ id: number; channel: VoiceChannel }>;

// A job cancelled here ends as an abort (the job slot answers `cancelled`); any other failure keeps its message.
function failureOf({ job }: Pending, message: string): unknown {
  const signal = job?.signal;
  return signal?.aborted ? signal.reason : new Error(message);
}

/**
 * The voice work done in one long-lived worker process (opened on the first job, kept, so its models stay loaded):
 * the main process only sends requests and hears progress. A job ends when the worker says it ended; a worker that
 * dies fails what was in flight with a readable error, and the next job opens a new one.
 */
export class WorkerVoiceWork implements VoiceWork {
  readonly #open: () => VoiceChannel;
  readonly #pending = new Map<number, Pending>();
  #channel: VoiceChannel | undefined;
  #restarting = false;
  #next = 1;

  constructor(open: () => VoiceChannel) {
    this.#open = open;
  }

  async generate(folder: string, job: VoiceJob): Promise<void> {
    const language = interfaceLanguage();
    await this.#ask((id) => ({ type: 'voices', id, folder, only: job.only, key: job.key, language }), job);
  }

  async sample(voice: SampleVoice, request: SampleRequest): Promise<SpokenSample> {
    const language = interfaceLanguage();
    const sample = await this.#ask((id) => ({ type: 'sample', id, voice, request, language }));
    if (!sample) throw new Error(translate('media.voiceWorkerAnswer'));
    return sample;
  }

  /**
   * Closes the worker so the next job opens a new one, which reads the install config and the models again (after a
   * model download or a voice setting change); a job in flight ends first.
   */
  restart(): void {
    this.#restarting = this.#channel !== undefined;
    this.#closeWhenIdle();
  }

  #ask(message: (id: number) => ToVoiceWorker, job?: VoiceJob): Promise<SpokenSample | undefined> {
    const asked = { id: this.#next++, channel: this.#channel ?? this.#opened() };
    return new Promise((resolve, reject) => {
      asked.channel.send(message(asked.id));
      this.#pending.set(asked.id, { resolve, reject, job });
      job?.signal?.addEventListener('abort', () => this.#cancel(asked), { once: true });
      if (job?.signal?.aborted) this.#cancel(asked);
    });
  }

  #closeWhenIdle(): void {
    const channel = this.#channel;
    if (!this.#restarting || !channel || this.#pending.size > 0) return;
    [this.#restarting, this.#channel] = [false, undefined];
    channel.kill();
  }

  #cancel({ id, channel }: Asked): void {
    if (this.#pending.has(id) && this.#channel === channel) channel.send({ type: 'cancel', id });
  }

  #opened(): VoiceChannel {
    const channel = this.#open();
    this.#channel = channel;
    channel.onMessage((message) => this.#heard(channel, message));
    channel.onExit((code) => this.#ended(channel, translate('media.voiceWorkerStopped', { code })));
    return channel;
  }

  #heard(channel: VoiceChannel, message: unknown): void {
    const parsed = fromVoiceWorker.safeParse(message);
    if (parsed.success) return this.#answer(parsed.data);
    this.#ended(channel, translate('media.voiceWorkerAnswer'));
    channel.kill();
  }

  #answer(message: FromVoiceWorker): void {
    const pending = this.#pending.get(message.id);
    if (!pending) return;
    if (message.type === 'line') return pending.job?.onLine?.(message.done, message.total, message.lineId);
    this.#pending.delete(message.id);
    this.#settle(pending, message);
    this.#closeWhenIdle();
  }

  #settle(pending: Pending, message: Exclude<FromVoiceWorker, Readonly<{ type: 'line' }>>): void {
    if (message.type === 'ended') return pending.resolve(message.sample);
    pending.reject(failureOf(pending, message.message));
  }

  // The worker is gone (or no longer trusted): what it had in flight fails, and the next job opens another one.
  #ended(channel: VoiceChannel, reason: string): void {
    if (this.#channel !== channel) return;
    this.#channel = undefined;
    const pending = [...this.#pending.values()];
    this.#pending.clear();
    pending.forEach(({ reject }) => reject(new Error(reason)));
  }
}
