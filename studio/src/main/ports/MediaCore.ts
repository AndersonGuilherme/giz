import type { CastCatalog, CharacterProblem, CharacterVoice, QwenModel } from '../../shared/cast.ts';
import type { StageBrief } from '../../shared/projects.ts';
import type { SceneImageProvider } from '../../shared/scenarios.ts';

/** Where each made thing of a project stands (core's ProjectStages, item by item). */
export type StageItems = Readonly<{
  stages: readonly StageBrief[];
  voices: Readonly<{ stale: readonly string[]; missing: readonly string[] }>;
  scenarios: Readonly<{ stale: readonly string[]; missing: readonly string[]; blocked: readonly string[]; problems: readonly string[] }>;
  /** What the pending voices cost: null when unknown, 0 with a free voice. */
  voiceDollars: number | null;
}>;

/** A voice for a sample: the project's service (never `recording`), its model and the service key, read by main. */
export type SampleVoice = Readonly<{ provider: 'qwen' | 'elevenlabs' | 'fish'; model?: QwenModel; key?: string }>;
export type SpokenSample = Readonly<{ wav: Uint8Array; seconds: number; envelope: readonly number[]; visemes: string }>;

/** One image job: the scene, the image AI and its key (read by main), cancel and the moment the call starts. */
export type ImageJob = Readonly<{ lineId: string; force: boolean; provider: SceneImageProvider; key?: string; signal?: AbortSignal; onCall?: () => void }>;
export type ImageCost = Readonly<{ model: string; pending: number; dollars: number | null }>;
/** The lines to make (`only` one, made again; or every pending one), the paid voice's key, cancel and progress. */
export type VoiceJob = Readonly<{ only?: string; key?: string; signal?: AbortSignal; onLine?: (done: number, total: number, lineId: string) => void }>;

/** Core's cast, scenarios and voices stages as the Studio uses them. */
export interface MediaCore {
  catalog(): Promise<CastCatalog>;
  checkCharacter(json: unknown): Promise<readonly CharacterProblem[]>;
  /** The ready characters' files (`casts/presets`), by id. */
  presetFiles(): Promise<readonly Readonly<{ id: string; name: string; personality: string; json: Readonly<Record<string, unknown>> }>[]>;
  sample(voice: SampleVoice, request: CharacterVoice & Readonly<{ text: string; language: 'pt-BR' | 'en' }>): Promise<SpokenSample>;
  items(folder: string): Promise<StageItems>;
  imageCost(folder: string, job: ImageJob): Promise<ImageCost>;
  generateImage(folder: string, job: ImageJob): Promise<void>;
  generateVoices(folder: string, job: VoiceJob): Promise<void>;
  /** The format the bytes start with (their magic bytes); undefined when they are not a PNG, JPEG or WebP picture. */
  imageFormat(bytes: Uint8Array): Promise<'png' | 'jpeg' | 'webp' | undefined>;
  /** The picture's size and whether it has the video's shape; undefined when its size cannot be read (WebP, broken). */
  imageShape(path: string, aspect: '9:16' | '16:9'): Promise<Readonly<{ width: number; height: number; matches: boolean }> | undefined>;
  /** Throws a readable error when the bytes are not a 16-bit PCM WAV. */
  checkWav(bytes: Uint8Array): Promise<void>;
}

/** The files of a project the media stages write (atomically) and read; paths are relative to the project folder. */
export interface MediaFiles {
  write(folder: string, file: string, bytes: Uint8Array): Promise<void>;
  read(folder: string, file: string): Promise<Uint8Array | undefined>;
  exists(folder: string, file: string): Promise<boolean>;
  /** Last change in milliseconds (the version of a giz-media URL), or undefined when there is no such file. */
  modified(folder: string, file: string): Promise<number | undefined>;
  remove(folder: string, file: string): Promise<void>;
  /** The files right inside the folder (not its subfolders), with their last change; none when it does not exist. */
  entries(folder: string): Promise<readonly Readonly<{ file: string; modified: number }>[]>;
}
