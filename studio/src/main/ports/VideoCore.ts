import type { Aspect, CheckReport, RenderedFiles } from '../../shared/contract.ts';
import type { StageItems } from './MediaCore.ts';

/** `signal` cancels the render; `onProgress` receives the done fraction (0 to 1). */
export type RenderJob = Readonly<{ signal: AbortSignal; onProgress: (fraction: number) => void }>;

/** The project seen in an aspect: its own aspect and title, its lines (in order) and core's check in that aspect. */
export type VideoInspection = Readonly<{
  projectAspect: Aspect;
  title: string;
  lines: readonly Readonly<{ lineId: string; text: string; speakerName: string }>[];
  check: CheckReport;
}>;

/** A file the video asks for (`at`, its path as the video names it) and where it is on disk (`from`). */
export type VideoFile = Readonly<{ at: string; from: string }>;
/** Core's video props (plain JSON), the files they ask for, the video length in seconds and its frames per second. */
export type VideoBuild = Readonly<{ props: unknown; files: readonly VideoFile[]; seconds: number; fps: number }>;

/** `variant`: other output files for the other aspect (`9x16` → output/video-9x16.mp4). */
export type VideoRenderJob = RenderJob & Readonly<{ variant?: string }>;

/** Where core's render writes a variant's video and captions, relative to the project folder. */
export type OutputFiles = Readonly<{ video: string; captions: string }>;

/** Core's Video stage: the project in an aspect, its montage (BuildTimeline) and its render. */
export interface VideoCore {
  inspect(folder: string, aspect: Aspect | undefined): Promise<VideoInspection>;
  /** The project's own aspect only (a light load: no check, no montage). */
  aspectOf(folder: string): Promise<Aspect>;
  items(folder: string): Promise<StageItems>;
  build(folder: string, aspect: Aspect): Promise<VideoBuild>;
  /** Core's own folders the preview plays from (its sound effects and fonts): served by the media scheme, never granted. */
  servedFolders(): Promise<readonly string[]>;
  /** Core's naming of a variant's output files (the one rule the render follows). */
  outputFiles(variant: string | undefined): Promise<OutputFiles>;
  /** `frames` only when less than the whole video was rendered (the rehearsal mode's first second). */
  render(folder: string, aspect: Aspect, job: VideoRenderJob): Promise<RenderedFiles & Readonly<{ frames?: number }>>;
}
