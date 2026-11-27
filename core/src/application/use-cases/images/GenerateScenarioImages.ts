import { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import type { Project } from '../../../domain/project/Project.ts';
import { imageJobs, type ImageDependencies, type ImageJob, type ImageSelection, type ImageStatus } from './scenarioImageJobs.ts';

/** `status` of the scene once done: `pending` became a generated image, `current` was kept, `own` left alone. */
export type ImageProgress = Readonly<{ done: number; total: number; lineId: string; status: ImageStatus }>;
export type ImageReport = { generated: string[]; kept: string[]; own: string[] };
/** The scenes to make, and a `signal` that aborts the image call in flight and is checked before each scene and before saving: a cancel saves and links nothing more. */
export type ImageRun = ImageSelection & Readonly<{ signal?: AbortSignal }>;
/** Before any paid call: how many images would be made, how many are current or the person's own, and the most it can cost. */
export type ImageEstimate = Readonly<{ pending: number; current: number; own: number; cost: CostEstimate }>;

const nothingToDo = () => undefined;
const REPORT_LIST: Readonly<Record<ImageStatus, keyof ImageReport>> = { pending: 'generated', current: 'kept', own: 'own' };
const countOf = (jobs: readonly ImageJob[], status: ImageStatus) => jobs.filter((job) => job.status === status).length;

/**
 * Makes the image of every scenario scene with `background.generate` (`scenes/<id>.png`) and points the scene's
 * `background.image` to it. An image whose prompt, style, aspect, service and model did not change is never made again;
 * a scene pointing to the person's own image is left alone.
 */
export class GenerateScenarioImages {
  readonly #dependencies: ImageDependencies;

  constructor(dependencies: ImageDependencies) {
    this.#dependencies = dependencies;
  }

  async estimate(project: Project, selection: ImageSelection = {}): Promise<ImageEstimate> {
    const jobs = await imageJobs(project, this.#dependencies, selection);
    const { images } = this.#dependencies;
    const pending = jobs.filter((job) => job.status === 'pending');
    const cost = pending.reduce((total, job) => total.plus(images.estimate(job.request)), CostEstimate.ZERO);
    return { pending: pending.length, current: countOf(jobs, 'current'), own: countOf(jobs, 'own'), cost };
  }

  async run(project: Project, selection: ImageRun = {}, onProgress: (progress: ImageProgress) => void = nothingToDo): Promise<ImageReport> {
    const jobs = await imageJobs(project, this.#dependencies, selection);
    const report: ImageReport = { generated: [], kept: [], own: [] };
    for (const [index, job] of jobs.entries()) {
      await this.#process(job, selection.signal);
      report[REPORT_LIST[job.status]].push(job.lineId);
      onProgress({ done: index + 1, total: jobs.length, lineId: job.lineId, status: job.status });
    }
    return report;
  }

  // Linked right after it is saved (and a current one linked again): a failure later keeps the images already paid for.
  async #process(job: ImageJob, signal: AbortSignal | undefined): Promise<void> {
    const { store } = this.#dependencies;
    signal?.throwIfAborted();
    if (job.status === 'own') return;
    if (job.status === 'pending') await this.#generate(job, signal);
    await store.link([job.lineId]);
  }

  // The signal aborts the paid call itself; an answer that still arrives after a cancel is thrown away.
  async #generate(job: ImageJob, signal: AbortSignal | undefined): Promise<void> {
    const { images, store } = this.#dependencies;
    const image = await images.generate(job.request, signal ? { signal } : {});
    signal?.throwIfAborted();
    await store.save({ lineId: job.lineId, image, hash: job.hash, madeBy: images.identity() });
  }
}
