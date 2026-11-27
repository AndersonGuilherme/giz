import type { RenderedFiles, RenderProgress } from '../../shared/contract.ts';
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
export type RenderRequest = Readonly<{ folder: string; aspect: RenderedAspect }>;
type RenderedAspect = Parameters<VideoCore['render']>[1];

/** Sends one progress event per whole percent, not one per frame. */
export function percentSteps(send: (progress: RenderProgress) => void): (fraction: number) => void {
  let last = -1;
  return (fraction) => {
    const percent = Math.floor(Math.min(Math.max(fraction, 0), 1) * 100);
    if (percent === last) return;
    last = percent;
    send({ fraction: percent / 100 });
  };
}

function failureOfRender(error: unknown, signal: AbortSignal): unknown {
  if (signal.aborted) return new StudioError('cancelled', translate('errors.cancelled'));
  return error;
}

/**
 * Renders one video at a time through core, in either aspect (the other one gets its own files), streaming progress;
 * "montar" and the check in that aspect come first. `cancel` stops the running render. Each render enters the history.
 */
export class RenderService {
  readonly #dependencies: Dependencies;
  #running: AbortController | undefined;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async render(request: RenderRequest): Promise<RenderedFiles> {
    const folder = this.#dependencies.grants.require(request.folder);
    if (this.#running) throw new StudioError('busy', translate('errors.busy'));
    const controller = new AbortController();
    this.#running = controller;
    try {
      return await this.#run({ ...request, folder }, controller.signal);
    } catch (error) {
      throw failureOfRender(error, controller.signal);
    } finally {
      this.#running = undefined;
    }
  }

  cancel(): boolean {
    this.#running?.abort();
    return this.#running !== undefined;
  }

  async #run({ folder, aspect }: RenderRequest, signal: AbortSignal): Promise<RenderedFiles> {
    const { core, build, files, progress, now = () => new Date() } = this.#dependencies;
    const montage = await build.ready(folder, aspect);
    signal.throwIfAborted();
    const variant = variantOf(aspect, montage.inspection.projectAspect);
    const { video, captions, seconds = montage.build.seconds } = await core.render(folder, aspect, { signal, onProgress: percentSteps(progress), variant });
    await recordRender(files, folder, { at: now().toISOString(), aspect, seconds: Math.min(seconds, montage.build.seconds), video, captions });
    return { video, captions };
  }
}
