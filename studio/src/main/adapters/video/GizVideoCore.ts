import { join } from 'node:path';
import type { Aspect, RenderedFiles } from '../../../shared/contract.ts';
import type { StageItems } from '../../ports/MediaCore.ts';
import type { OutputFiles, VideoBuild, VideoCore, VideoInspection, VideoRenderJob } from '../../ports/VideoCore.ts';
import { stageItemsOf } from '../media/coreJobs.ts';
import { coreAspect, coreMain } from '../media/mediaModules.ts';
import { StudioError } from '../../services/StudioError.ts';
import { translate } from '../../text.ts';

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

// The project loaded once, and seen in `aspect` when one is given.
async function loaded(folder: string, aspect: Aspect | undefined): Promise<Readonly<{ own: Project; project: Project }>> {
  const [video, { AspectRatio }] = await Promise.all([coreVideo(), coreAspect()]);
  const own = await video.projectInAspect(folder);
  return { own, project: aspect === undefined ? own : own.inAspect(AspectRatio.of(aspect)) };
}

// Core's CheckFailed as the Studio's readable failure (the same one the montage's check gives); other errors as they are.
function checkFailure(error: unknown, aspect: Aspect): unknown {
  const problems = error instanceof Error && error.name === 'CheckFailed' ? (error as Error & { problems: readonly Readonly<{ line: string; message: string }>[] }).problems : undefined;
  if (!problems) return error;
  const lines = problems.map(({ line, message }) => (line ? translate('video.lineProblem', { number: line, message }) : message));
  return new StudioError('invalid-project', translate('video.checkErrors', { count: problems.length, aspect }), lines);
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
    const [{ own, project }, main] = await Promise.all([loaded(folder, aspect), coreMain()]);
    const check = await main.checkProject().run(project);
    return { projectAspect: own.aspect().text(), title: own.title(), lines: linesOf(own), check: structuredClone(check) };
  }

  async aspectOf(folder: string): Promise<Aspect> {
    return (await (await coreVideo()).projectInAspect(folder)).aspect().text();
  }

  items(folder: string): Promise<StageItems> {
    return stageItemsOf(folder);
  }

  async build(folder: string, aspect: Aspect): Promise<VideoBuild> {
    const [video, { VideoClock }, { project }] = await Promise.all([coreVideo(), coreClock(), loaded(folder, aspect)]);
    const { props, files } = await video.videoPreview(folder, project);
    const seconds = VideoClock.of(props.totalFrames).durationInFrames() / props.fps;
    return { props: structuredClone(props), files, seconds, fps: props.fps };
  }

  async servedFolders(): Promise<readonly string[]> {
    const publicFolder = (await coreMain()).publicFolder();
    return [join(publicFolder, 'sounds'), join(publicFolder, 'fonts')];
  }

  async outputFiles(variant: string | undefined): Promise<OutputFiles> {
    return (await coreVideo()).outputFilesOf(variant);
  }

  // The project is checked again as it is rendered (the same loaded project): a change saved after the montage's check
  // and before this load cannot reach the video unchecked.
  async render(folder: string, aspect: Aspect, job: VideoRenderJob): Promise<RenderedFiles & Readonly<{ frames?: number }>> {
    const [{ project }, main] = await Promise.all([loaded(folder, aspect), coreMain()]);
    const output = { checked: true, ...(job.variant === undefined ? {} : { variant: job.variant }), ...(this.#frames === undefined ? {} : { frames: this.#frames }) };
    const files = await main.renderVideo(folder, job.signal, output).run(folder, project, job.onProgress).catch((error: unknown) => {
      throw checkFailure(error, aspect);
    });
    return this.#frames === undefined ? files : { ...files, frames: this.#frames };
  }
}
