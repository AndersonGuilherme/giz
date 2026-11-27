import { CostEstimate } from '../../../domain/ai/CostEstimate.ts';
import type { Project } from '../../../domain/project/Project.ts';
import { imageJobs, type ImageDependencies, type ImageJob, type ImageSelection } from './scenarioImageJobs.ts';

export type ImageProgress = Readonly<{ done: number; total: number; lineId: string; generated: boolean }>;
export type ImageReport = { generated: string[]; kept: string[] };
/** Before any paid call: how many images would be made, how many are already current, and the most it can cost. */
export type ImageEstimate = Readonly<{ pending: number; current: number; cost: CostEstimate }>;

const nothingToDo = () => undefined;

/**
 * Makes the image of every scenario scene with `background.generate` (`scenes/<id>.png`) and points the scene's
 * `background.image` to it. An image whose prompt, style, aspect, service and model did not change is never made again.
 */
export class GenerateScenarioImages {
  readonly #dependencies: ImageDependencies;

  constructor(dependencies: ImageDependencies) {
    this.#dependencies = dependencies;
  }

  async estimate(project: Project, selection: ImageSelection = {}): Promise<ImageEstimate> {
    const jobs = await imageJobs(project, this.#dependencies, selection);
    const pending = jobs.filter((job) => !job.current);
    const { images } = this.#dependencies;
    const cost = pending.reduce((total, job) => total.plus(images.estimate(job.request)), CostEstimate.ZERO);
    return { pending: pending.length, current: jobs.length - pending.length, cost };
  }

  async run(project: Project, selection: ImageSelection = {}, onProgress: (progress: ImageProgress) => void = nothingToDo): Promise<ImageReport> {
    const jobs = await imageJobs(project, this.#dependencies, selection);
    const report: ImageReport = { generated: [], kept: [] };
    for (const [index, job] of jobs.entries()) {
      await this.#process(job);
      (job.current ? report.kept : report.generated).push(job.lineId);
      onProgress({ done: index + 1, total: jobs.length, lineId: job.lineId, generated: !job.current });
    }
    return report;
  }

  // Linked right after it is saved (and a current one linked again): a failure later keeps the images already paid for.
  async #process(job: ImageJob): Promise<void> {
    const { images, store } = this.#dependencies;
    if (!job.current) await store.save({ lineId: job.lineId, image: await images.generate(job.request), hash: job.hash, madeBy: images.identity() });
    await store.link([job.lineId]);
  }
}
