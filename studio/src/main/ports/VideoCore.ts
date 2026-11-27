import type { Aspect, CheckReport, RenderedFiles } from '../../shared/contract.ts';
import type { StageItems } from './MediaCore.ts';
import type { RenderJob } from './StudioCore.ts';

/** The project seen in an aspect: its own aspect and title, its lines (in order) and core's check in that aspect. */
export type VideoInspection = Readonly<{
  projectAspect: Aspect;
  title: string;
  lines: readonly Readonly<{ lineId: string; text: string; speakerName: string }>[];
  check: CheckReport;
}>;

/** A file the video asks for (`at`, its path as the video names it) and where it is on disk (`from`). */
export type VideoFile = Readonly<{ at: string; from: string }>;
/** Core's video props (plain JSON), the files they ask for and the video length in seconds. */
export type VideoBuild = Readonly<{ props: unknown; files: readonly VideoFile[]; seconds: number }>;

/** `variant`: other output files for the other aspect (`9x16` → output/video-9x16.mp4). */
export type VideoRenderJob = RenderJob & Readonly<{ variant?: string }>;

/** Core's Video stage: the project in an aspect, its montage (BuildTimeline) and its render. */
export interface VideoCore {
  inspect(folder: string, aspect: Aspect | undefined): Promise<VideoInspection>;
  items(folder: string): Promise<StageItems>;
  build(folder: string, aspect: Aspect): Promise<VideoBuild>;
  /** Core's sound effects folder: the preview plays them from there (the media scheme serves it once granted). */
  soundsFolder(): Promise<string>;
  /** `seconds` only when less than the whole video was rendered (the rehearsal mode's first second). */
  render(folder: string, aspect: Aspect, job: VideoRenderJob): Promise<RenderedFiles & Readonly<{ seconds?: number }>>;
}
