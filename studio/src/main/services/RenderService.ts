import { resolve } from 'node:path';
import type { Aspect, RenderedFiles, RenderJobStatus, RenderProgress } from '../../shared/contract.ts';
import type { MediaFiles } from '../ports/MediaCore.ts';
import type { VideoCore } from '../ports/VideoCore.ts';
import { translate } from '../text.ts';
import { StudioError } from './StudioError.ts';
import type { FolderGrants } from './FolderGrants.ts';
import type { BuildService } from './video/BuildService.ts';
import { variantOf } from './video/outputFiles.ts';
import { recordRender } from './video/renderHistory.ts';

type Dependencies = Readonly<{
  core: VideoCore;
  build: BuildService;
  files: MediaFiles;
  grants: FolderGrants;
  progress: (progress: RenderProgress) => void;
  now?: () => Date;
}>;
export type RenderRequest = Readonly<{ folder: string; aspect: Aspect }>;
type Running = RenderRequest & Readonly<{ controller: AbortController; work: Promise<unknown> }>;

/** Sends one progress event per whole percent, not one per frame. */
export function percentSteps(send: (fraction: number) => void): (fraction: number) => void {
  let last = -1;
  return (fraction) => {
    const percent = Math.floor(Math.min(Math.max(fraction, 0), 1) * 100);
    if (percent === last) return;
    last = percent;
    send(percent / 100);
  };
}

function failureOfRender(error: unknown, signal: AbortSignal): unknown {
  if (signal.aborted) return new StudioError('cancelled', translate('errors.cancelled'));
  return error;
}

const waited = (milliseconds: number) => new Promise<void>((done) => setTimeout(done, milliseconds));

/**
 * Renders one video at a time through core, in either aspect (the other one gets its own files), streaming progress
 * that names the render; "montar" and the check in that aspect come first. The running render can be asked for (a
 * screen shown again re-attaches to it) and cancelled by its folder. Each finished render enters the history.
 */
export class RenderService {
  readonly #dependencies: Dependencies;
  #running: Running | undefined;
  #fraction: number | null = null;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async render(request: RenderRequest): Promise<RenderedFiles> {
    const folder = this.#dependencies.grants.require(request.folder);
    if (this.#running) throw new StudioError('busy', translate('errors.busy'));
    const controller = new AbortController();
    const work = this.#run({ folder, aspect: request.aspect }, controller.signal);
    this.#running = { folder, aspect: request.aspect, controller, work: work.catch(() => undefined) };
    this.#fraction = null;
    try {
      return await work;
    } catch (error) {
      throw failureOfRender(error, controller.signal);
    } finally {
      this.#running = undefined;
    }
  }

  /** The render running now (its folder, aspect and progress, null while it prepares), or null. */
  status(): RenderJobStatus | null {
    const running = this.#running;
    return running ? { folder: running.folder, aspect: running.aspect, fraction: this.#fraction } : null;
  }

  /** Cancels the render of that folder; false when that folder is not rendering. */
  cancel(folder: string): boolean {
    const running = this.#running;
    if (running?.folder !== resolve(folder)) return false;
    running.controller.abort();
    return true;
  }

  /** On quit: cancels the running render and waits for it to end (its browser and encoder gone), at most `milliseconds`. */
  async stop(milliseconds: number): Promise<void> {
    const running = this.#running;
    running?.controller.abort();
    await Promise.race([running?.work, waited(milliseconds)]);
  }

  async #run({ folder, aspect }: RenderRequest, signal: AbortSignal): Promise<RenderedFiles> {
    const { core, build, files, progress, now = () => new Date() } = this.#dependencies;
    const montage = await build.ready(folder, aspect);
    signal.throwIfAborted();
    const onProgress = percentSteps((fraction) => progress({ folder, aspect, fraction: (this.#fraction = fraction) }));
    const variant = variantOf(aspect, montage.inspection.projectAspect);
    const { video, captions, frames } = await core.render(folder, aspect, { signal, onProgress, variant });
    const seconds = frames === undefined ? montage.build.seconds : Math.min(frames / montage.build.fps, montage.build.seconds);
    await recordRender(files, folder, { at: now().toISOString(), aspect, seconds, video, captions });
    return { video, captions };
  }
}
