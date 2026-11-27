// The Scenarios stage: one card per scenario scene, with its background (vector, uploaded or generated).
import type { StageBrief } from './projects.ts';

export const IMAGE_STYLES = ['painted-2d', 'flat-vector', 'watercolor', 'chalk'] as const;
export type ImageStyle = (typeof IMAGE_STYLES)[number];
export const SCENE_IMAGE_PROVIDERS = ['openai', 'gemini', 'fal'] as const;
export type SceneImageProvider = (typeof SCENE_IMAGE_PROVIDERS)[number];

/**
 * What the scene shows now: a vector background, or an image (`own`: the person's upload, which wins over generation;
 * `url` to show it; `aspectWarning` when its shape is not the video's).
 */
export type SceneBackground =
  | Readonly<{ kind: 'vector'; vector: string; colors: Readonly<Record<string, string>> }>
  | Readonly<{ kind: 'image'; image: string; url: string | null; own: boolean; aspectWarning?: string }>;

/** The image AI's part: `done`, `missing`, `stale` (the prompt changed) or `blocked` (`problem` says why); none without a prompt. */
export type GeneratedState = 'done' | 'missing' | 'stale' | 'blocked';
export type SceneCard = Readonly<{
  lineId: string;
  /** The line's number in the script (1 = the first line). */
  number: number;
  text: string;
  background: SceneBackground;
  generate?: Readonly<{ prompt: string; style?: ImageStyle }>;
  /** The prompt of a scene switched to a vector: no longer used (the image AI does not make it), kept to start from. */
  keptPrompt?: Readonly<{ prompt: string; style?: ImageStyle }>;
  /** The image giz made for this scene (scenes/<id>.png), shown even while an upload wins. */
  generated: string | null;
  state?: GeneratedState;
  problem?: string;
}>;

export type ScenariosDocument = Readonly<{
  folder: string;
  aspect: '9:16' | '16:9';
  style: ImageStyle;
  /** The project's image AI, or the one chosen in Settings. */
  provider: SceneImageProvider;
  vectors: readonly string[];
  cards: readonly SceneCard[];
  stages: readonly StageBrief[];
}>;

/** Before a paid image: the service, the model and the most it costs (null when unknown). */
export type ImageEstimate = Readonly<{ provider: string; model: string; pending: number; dollars: number | null }>;
export type ImageProgress = Readonly<{ lineId: string; phase: 'calling' | 'done' }>;
export const SCENARIOS_PROGRESS_EVENT = 'scenarios.progress';
/** The most an uploaded picture may weigh. */
export const MAXIMUM_IMAGE_BYTES = 25 * 1024 * 1024;

type Channel<Request, Response> = Readonly<{ request: Request; response: Response }>;
type SceneRequest = Readonly<{ folder: string; lineId: string }>;

export type ScenarioChannels = Readonly<{
  'scenarios.read': Channel<Readonly<{ folder: string }>, ScenariosDocument>;
  'scenarios.vector': Channel<SceneRequest & Readonly<{ vector: string }>, ScenariosDocument>;
  /** Copies the picture into scenes/ and points the scene to it (it wins over a generated one). */
  'scenarios.upload': Channel<SceneRequest & Readonly<{ bytes: Uint8Array }>, ScenariosDocument>;
  'scenarios.prompt': Channel<SceneRequest & Readonly<{ prompt: string; style?: ImageStyle }>, ScenariosDocument>;
  'scenarios.estimate': Channel<SceneRequest & Readonly<{ force: boolean }>, ImageEstimate>;
  /** Makes (or `force`: makes again) the scene's image with the image AI; progress on `scenarios.progress`; cancellable. */
  'scenarios.generate': Channel<SceneRequest & Readonly<{ force: boolean }>, ScenariosDocument>;
  'scenarios.cancel': Channel<Readonly<Record<string, never>>, boolean>;
  /** "Usar a gerada": the scene points back to scenes/<id>.png (or to nothing, so the image AI makes it). */
  'scenarios.useGenerated': Channel<SceneRequest, ScenariosDocument>;
  'scenarios.settings': Channel<Readonly<{ folder: string; style?: ImageStyle; provider?: SceneImageProvider }>, ScenariosDocument>;
}>;
