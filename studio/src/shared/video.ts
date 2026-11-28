// The Video stage: the preview of the whole video ("montar" first), the check in the chosen aspect, what is missing,
// the render and what it left (the video, its captions and the last renders).
import type { Aspect } from './contract.ts';
import type { StageBrief } from './projects.ts';

/** A line of the script as the Video stage lists it (its number counts from 1). */
export type VideoLine = Readonly<{ lineId: string; number: number; text: string; speakerName: string }>;

/** A check problem in the chosen aspect: `line` is the line id (empty for the whole project). */
export type VideoProblem = Readonly<{ line: string; message: string }>;
export type VideoCheck = Readonly<{ errors: readonly VideoProblem[]; warnings: readonly VideoProblem[] }>;

/** What the video still lacks (line ids): voices to make or remake, scenario images to make, remake or resolve. */
export type VideoMissing = Readonly<{
  voices: readonly string[];
  staleVoices: readonly string[];
  images: readonly string[];
  staleImages: readonly string[];
  blockedImages: readonly string[];
}>;

/** The montage: core's video props, and the URL (gizzy-media) of each file they ask for, by its path in the project. */
export type VideoMontage = Readonly<{ video: unknown; files: Readonly<Record<string, string>>; seconds: number }>;

/** Why the montage could not be made: `voices` lists the lines without audio when that is the reason. */
export type MontageFailure = Readonly<{ message: string; details: readonly string[]; voices: readonly string[] }>;

/** One finished render: when, in which aspect, how long the video is and its files. */
export type RenderRecord = Readonly<{ at: string; aspect: Aspect; seconds: number; video: string; captions: string }>;

/** The last video rendered in an aspect, to play in the window (a gizzy-media URL), and whether its captions exist. */
export type RenderedVideo = Readonly<{ aspect: Aspect; url: string; captions: boolean }>;

export type VideoDocument = Readonly<{
  folder: string;
  title: string;
  projectAspect: Aspect;
  aspect: Aspect;
  lines: readonly VideoLine[];
  check: VideoCheck;
  missing: VideoMissing;
  stages: readonly StageBrief[];
  /** null when it could not be made (`failure` says why). */
  montage: VideoMontage | null;
  failure: MontageFailure | null;
  rendered: readonly RenderedVideo[];
  /** Newest first. */
  renders: readonly RenderRecord[];
}>;

type Channel<Request, Response> = Readonly<{ request: Request; response: Response }>;
type AspectRequest = Readonly<{ folder: string; aspect: Aspect }>;

export type VideoChannels = Readonly<{
  /** Montar (props of every line, voices required), check in `aspect` (the project's own when absent), what is missing. */
  'video.preview': Channel<Readonly<{ folder: string; aspect?: Aspect }>, VideoDocument>;
  /** Opens the project's output folder in the system's file manager. */
  'video.openFolder': Channel<Readonly<{ folder: string }>, true>;
  /** Copies the captions (SRT) of the last render in that aspect to the clipboard. */
  'video.copyCaptions': Channel<AspectRequest, true>;
  /** Saves a copy of those captions where the person chooses; null when the dialog was closed. */
  'video.exportCaptions': Channel<AspectRequest, string | null>;
}>;
