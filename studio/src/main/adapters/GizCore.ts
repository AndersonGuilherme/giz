import type { Project, StudioCore } from '../ports/StudioCore.ts';

type Composition = typeof import('giz-core/src/presentation/cli/composition.ts');

// Core runs as its own TypeScript source (Node strips the types), loaded on first use: the window opens without
// waiting for it, and core's composition point resolves its Remotion entry and sounds from its own package folder.
const loadComposition = (): Promise<Composition> => import('giz-core/src/presentation/cli/composition.ts');

/** The Studio's door into core: the same composition point the `giz` CLI uses. */
export class GizCore implements StudioCore {
  #composition: Promise<Composition> | undefined;

  async load(folder: string): Promise<Project> {
    const composition = await this.#loaded();
    return composition.projectRepository().load(folder);
  }

  async check(project: Project) {
    const composition = await this.#loaded();
    return composition.checkProject().run(project);
  }

  #loaded(): Promise<Composition> {
    this.#composition ??= loadComposition();
    return this.#composition;
  }
}
