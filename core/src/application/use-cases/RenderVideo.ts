import type { Project } from '../../domain/project/Project.ts';
import type { VideoProps } from '../../domain/timeline/VideoProps.ts';
import type { CaptionWriter } from '../ports/CaptionWriter.ts';
import type { Renderer } from '../ports/Renderer.ts';

/** Where a project's video and captions go, inside its folder (`output/` is gitignored). */
export type VideoFiles = Readonly<{ video: string; captions: string }>;
type Timelines = Readonly<{ run(project: Project): Promise<VideoProps> }>;
type Dependencies = Readonly<{ build: Timelines; renderer: Renderer; captions: CaptionWriter }>;

const nothingToDo = () => undefined;

// Plain text paths: the application does not import node:path; `/` works on every system Node runs on.
function filesOf(folder: string): VideoFiles {
  const output = `${folder.replace(/[/\\]+$/, '')}/output`;
  return { video: `${output}/video.mp4`, captions: `${output}/captions.srt` };
}

/** Builds the timeline of a loaded project (its voices already saved), renders the video and writes the captions. */
export class RenderVideo {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  async run(folder: string, project: Project, onProgress: (fraction: number) => void = nothingToDo): Promise<VideoFiles> {
    const { build, renderer, captions } = this.#dependencies;
    const files = filesOf(folder);
    const props = await build.run(project);
    await renderer.render(props, files.video, onProgress);
    await captions.write(props, files.captions);
    return files;
  }
}
