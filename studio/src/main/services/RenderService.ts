import type { Aspect, RenderedFiles, RenderProgress } from '../../shared/contract.ts';
import { translate } from '../text.ts';
import { StudioError } from './StudioError.ts';
import type { StudioCore } from '../ports/StudioCore.ts';
import type { FolderGrants } from './FolderGrants.ts';

type Dependencies = Readonly<{ core: StudioCore; grants: FolderGrants; progress: (progress: RenderProgress) => void }>;
export type RenderRequest = Readonly<{ folder: string; aspect: Aspect }>;

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

/** Renders one video at a time through core, streaming progress; `cancel` stops the running render. */
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
    const { core, progress } = this.#dependencies;
    const project = await core.load(folder);
    const projectAspect = project.aspect().text();
    if (projectAspect !== aspect) throw new StudioError('invalid-request', translate('errors.aspect', { project: projectAspect, asked: aspect }));
    signal.throwIfAborted();
    return core.render(folder, project, { signal, onProgress: percentSteps(progress) });
  }
}
