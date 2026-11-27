import type { Project } from 'giz-core/src/domain/project/Project.ts';
import type { CheckReport, RenderedFiles } from '../../shared/contract.ts';

export type { Project };

/** `signal` cancels the render; `onProgress` receives the done fraction (0 to 1). */
export type RenderJob = Readonly<{ signal: AbortSignal; onProgress: (fraction: number) => void }>;

/** The core use cases the Studio calls, wired by core's own composition point (tests pass a fake). */
export interface StudioCore {
  load(folder: string): Promise<Project>;
  check(project: Project): Promise<CheckReport>;
  render(folder: string, project: Project, job: RenderJob): Promise<RenderedFiles>;
}
