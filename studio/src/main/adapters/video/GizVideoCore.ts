import { join } from 'node:path';
import type { Aspect, RenderedFiles } from '../../../shared/contract.ts';
import type { StageItems } from '../../ports/MediaCore.ts';
import type { VideoBuild, VideoCore, VideoInspection, VideoRenderJob } from '../../ports/VideoCore.ts';
import { stageItemsOf } from '../media/coreJobs.ts';
import { coreMain } from '../media/mediaModules.ts';

type CoreVideo = typeof import('giz-core/src/presentation/cli/composition/video.ts');
type CoreClock = typeof import('giz-core/src/domain/video/VideoClock.ts');
type Project = Awaited<ReturnType<CoreVideo['projectInAspect']>>;

const coreVideo = (): Promise<CoreVideo> => import('giz-core/src/presentation/cli/composition/video.ts');
const coreClock = (): Promise<CoreClock> => import('giz-core/src/domain/video/VideoClock.ts');

function linesOf(project: Project): VideoInspection['lines'] {
  const cast = project.cast();
  const nameOf = (id: Parameters<typeof cast.contains>[0]) => (cast.contains(id) ? cast.character(id).name() : id.text());
  return project.script().lines().each().map((line) => ({ lineId: line.id(), text: line.text(), speakerName: nameOf(line.speaker()) }));
}

/**
 * Core's Video stage through its composition point (loaded on first use). `frames`: renders only the first frames
 * (the rehearsal mode's short real render); none: the whole video.
 */
export class GizVideoCore implements VideoCore {
  readonly #frames: number | undefined;

  constructor(options: Readonly<{ frames?: number }> = {}) {
    this.#frames = options.frames;
  }

  async inspect(folder: string, aspect: Aspect | undefined): Promise<VideoInspection> {
    const [video, main] = await Promise.all([coreVideo(), coreMain()]);
    const [own, project] = await Promise.all([video.projectInAspect(folder), video.projectInAspect(folder, aspect)]);
    const check = await main.checkProject().run(project);
    return { projectAspect: own.aspect().text() as Aspect, title: own.title(), lines: linesOf(own), check: structuredClone(check) };
  }

  items(folder: string): Promise<StageItems> {
    return stageItemsOf(folder);
  }

  async build(folder: string, aspect: Aspect): Promise<VideoBuild> {
    const [video, { VideoClock }] = await Promise.all([coreVideo(), coreClock()]);
    const { props, files } = await video.videoPreview(folder, await video.projectInAspect(folder, aspect));
    const seconds = VideoClock.of(props.totalFrames).durationInFrames() / props.fps;
    return { props: structuredClone(props), files, seconds };
  }

  async soundsFolder(): Promise<string> {
    return join((await coreMain()).publicFolder(), 'sounds');
  }

  async render(folder: string, aspect: Aspect, job: VideoRenderJob): Promise<RenderedFiles & Readonly<{ seconds?: number }>> {
    const [video, main] = await Promise.all([coreVideo(), coreMain()]);
    const project = await video.projectInAspect(folder, aspect);
    const output = { ...(job.variant === undefined ? {} : { variant: job.variant }), ...(this.#frames === undefined ? {} : { frames: this.#frames }) };
    const files = await main.renderVideo(folder, job.signal, output).run(folder, project, job.onProgress);
    return this.#frames === undefined ? files : { ...files, seconds: this.#frames / 30 };
  }
}
