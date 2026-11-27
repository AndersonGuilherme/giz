// The projects of the home screen and the new-project wizard (the Idea stage). Plain types and constants.
import type { Aspect } from './contract.ts';
import type { InterfaceLanguage } from './i18n/translate.ts';

/** Core's stages of a project (P4), in order, and the state of each. */
export const STAGES = ['idea', 'script', 'cast', 'scenarios', 'voices', 'video'] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_STATES = ['empty', 'ready', 'stale', 'done'] as const;
export type StageState = (typeof STAGE_STATES)[number];
/** `problems`: how many reasons the stage is not done (script errors, items out of date or missing). */
export type StageBrief = Readonly<{ stage: Stage; state: StageState; problems: number }>;

/** A project folder on the home screen; `problem` when its project.json cannot be read (the folder is still listed). */
export type ProjectListing = Readonly<{
  folder: string;
  title: string;
  format: string;
  aspect: string;
  language: string;
  stages: readonly StageBrief[];
  /** Last change of any file in the folder, in milliseconds since 1970. */
  modified: number;
  problem?: string;
}>;

export const FORMATS = ['story', 'lesson'] as const;
export type Format = (typeof FORMATS)[number];
/** The video's language (always pt-BR or en, like the interface). */
export type VideoLanguage = InterfaceLanguage;

/** What the wizard asks (core's idea.json): `cast` are preset ids, `scenes` vector backgrounds or scene presets. */
export type IdeaFields = Readonly<{
  format: Format;
  aspect: Aspect;
  targetSeconds: number;
  theme: string;
  audience: string;
  tone: string;
  language: VideoLanguage;
  cast?: readonly string[];
  scenes?: readonly string[];
}>;

/** The limits core's Idea checks; the wizard shows them and the main process refuses anything outside. */
export const IDEA_LIMITS = { seconds: { min: 10, max: 900 }, theme: 600, short: 200 } as const;

/** A ready character; `rig` null for a voice without a body. */
export type CastPresetBrief = Readonly<{ id: string; name: string; personality: string; rig: string | null }>;
export type ScenePresetBrief = Readonly<{ id: string; name: string; description: string }>;
export type Presets = Readonly<{ cast: readonly CastPresetBrief[]; scenes: readonly ScenePresetBrief[]; backgrounds: readonly string[] }>;

/** One picture with every ready character as a square (`cell` px, `columns` per row), in the order of `ids`. */
export type Portraits = Readonly<{ image: string; cell: number; columns: number; ids: readonly string[] }>;

/** Before generating: the provider and model chosen in Settings and the cost in dollars (null when unknown). */
export type ScriptEstimate = Readonly<{ provider: string; model: string; firstCall: number | null; maximum: number | null; calls: number }>;
/** Before each call to the text AI: call 1 of 4, then 2 of 4 for a repair... */
export type ScriptProgress = Readonly<{ call: number; most: number }>;
export type GeneratedScript = Readonly<{ folder: string; repairs: number; calls: number }>;

/** The event the main process pushes before each call of a script generation. */
export const SCRIPT_PROGRESS_EVENT = 'script.progress';
