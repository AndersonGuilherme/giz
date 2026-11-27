import type { SpokenSample } from '../ports/MediaCore.ts';
import type { VoiceWork } from '../ports/VoiceWork.ts';
import { setInterfaceLanguage, translate } from '../text.ts';
import { toVoiceWorker, type FromVoiceWorker, type ToVoiceWorker } from './voiceMessages.ts';

type Tell = (message: FromVoiceWorker) => void;
type Job = Exclude<ToVoiceWorker, Readonly<{ type: 'cancel' }>>;

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));
const idOf = (message: unknown) => (message as { id?: unknown } | null)?.id;

/**
 * The voice worker's side: each job asked runs after the one before (the loaded models serve one job at a time); a
 * cancel reaches its job at once, and every job ends with exactly one `ended` or `failed`.
 */
export class VoiceJobs {
  readonly #work: VoiceWork;
  readonly #tell: Tell;
  readonly #controllers = new Map<number, AbortController>();
  #queue: Promise<void> = Promise.resolve();

  constructor(work: VoiceWork, tell: Tell) {
    this.#work = work;
    this.#tell = tell;
  }

  receive(message: unknown): void {
    const parsed = toVoiceWorker.safeParse(message);
    if (!parsed.success) return this.#refuse(idOf(message));
    if (parsed.data.type === 'cancel') return void this.#controllers.get(parsed.data.id)?.abort();
    this.#controllers.set(parsed.data.id, new AbortController());
    const job = parsed.data;
    this.#queue = this.#queue.then(() => this.#run(job));
  }

  async #run(job: Job): Promise<void> {
    const signal = this.#controllers.get(job.id)!.signal;
    setInterfaceLanguage(job.language);
    try {
      const sample = await this.#perform(job, signal);
      this.#tell(sample ? { type: 'ended', id: job.id, sample } : { type: 'ended', id: job.id });
    } catch (error) {
      this.#tell({ type: 'failed', id: job.id, message: messageOf(error) });
    } finally {
      this.#controllers.delete(job.id);
    }
  }

  async #perform(job: Job, signal: AbortSignal): Promise<SpokenSample | undefined> {
    if (job.type === 'sample') return this.#work.sample(job.voice, job.request);
    const onLine = (done: number, total: number, lineId: string) => this.#tell({ type: 'line', id: job.id, done, total, lineId });
    await this.#work.generate(job.folder, { only: job.only, key: job.key, signal, onLine });
    return undefined;
  }

  // A request of another shape runs nothing; when it carries a job number, that job is answered as failed.
  #refuse(id: unknown): void {
    if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) return;
    this.#tell({ type: 'failed', id, message: translate('media.voiceWorkerRefused') });
  }
}
