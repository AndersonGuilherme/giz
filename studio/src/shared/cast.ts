// The Cast stage: the characters of a project, the rigs they are drawn with and the voices they speak with.
import type { StageBrief } from './projects.ts';

export type ParameterType = 'color' | 'number' | 'option' | 'boolean';
export type ParameterValue = string | number | boolean;
/** One parameter of a rig (core's rig catalog): the control the editor draws comes from its type. */
export type ParameterInfo = Readonly<{ type: ParameterType; defaultValue: ParameterValue; min?: number; max?: number; options?: readonly string[] }>;
export type RigInfo = Readonly<{ id: string; name: Readonly<{ 'pt-BR': string; en: string }>; parameters: Readonly<Record<string, ParameterInfo>> }>;

/** The project voice services (core's `voice.provider`) and the local voice's models. */
export const CAST_VOICE_PROVIDERS = ['qwen', 'recording', 'elevenlabs', 'fish'] as const;
export type CastVoiceProvider = (typeof CAST_VOICE_PROVIDERS)[number];
export const QWEN_MODELS = ['0.6b', '1.7b'] as const;
export type QwenModel = (typeof QWEN_MODELS)[number];

/** What the cast editor offers: the rigs, the local voice ids and the default voice style per video language. */
export type CastCatalog = Readonly<{ rigs: readonly RigInfo[]; qwenVoices: readonly string[]; styles: Readonly<Record<'pt-BR' | 'en', string>> }>;

export type CharacterVoice = Readonly<{ id: string; style?: string }>;
/** A cast/<id>.json as the editor keeps it (`rig` absent: the narrator, a voice without a body). */
export type CharacterFile = Readonly<{
  id: string;
  name: string;
  rig?: string;
  parameters: Readonly<Record<string, ParameterValue>>;
  voice: CharacterVoice;
  personality?: string;
  defaultExpression: string;
}>;

/** A character of the project and how many lines it says; `problem` when its file could not be read. */
export type CastMember = Readonly<{ file: CharacterFile; lines: number; problem?: string }>;
export type ProjectVoice = Readonly<{ provider: CastVoiceProvider; model?: QwenModel }>;
/** A ready character (`casts/presets`) to add, with the file that is copied. */
export type CastPreset = Readonly<{ id: string; name: string; personality: string; file: CharacterFile }>;

export type CastDocument = Readonly<{
  folder: string;
  language: 'pt-BR' | 'en';
  voice: ProjectVoice;
  members: readonly CastMember[];
  presets: readonly CastPreset[];
  stages: readonly StageBrief[];
}>;

/** One problem of a character file: the field (`parameters.skin`) and the message. */
export type CharacterProblem = Readonly<{ path: string; message: string }>;
/** After a save: nothing is written while there are problems. */
export type CharacterSaved = Readonly<{ saved: boolean; problems: readonly CharacterProblem[]; document: CastDocument }>;

/** "Ouvir amostra": the sample's audio (a giz-media URL), its length and its mouth per frame (for the live preview). */
export type VoiceSample = Readonly<{ audio: string; seconds: number; envelope: readonly number[]; visemes: string }>;
export type SampleRequest = Readonly<{ folder: string; voice: CharacterVoice; text: string }>;

type Channel<Request, Response> = Readonly<{ request: Request; response: Response }>;
type FolderRequest = Readonly<{ folder: string }>;

export type CastChannels = Readonly<{
  'cast.catalog': Channel<Readonly<Record<string, never>>, CastCatalog>;
  'cast.read': Channel<FolderRequest, CastDocument>;
  /** Checks a character with core's rig catalog without saving it (the editor shows the problems as the person edits). */
  'cast.check': Channel<Readonly<{ character: CharacterFile }>, readonly CharacterProblem[]>;
  /** Saves cast/<id>.json atomically when core finds no problem. */
  'cast.save': Channel<FolderRequest & Readonly<{ character: CharacterFile }>, CharacterSaved>;
  /** Adds a ready character (`preset`) or a new one (`id` and `name`) to the project. */
  'cast.add': Channel<FolderRequest & Readonly<{ preset?: string; id?: string; name?: string }>, CastDocument>;
  /** Takes a character out of the project (refused while a line still says it); its file stays. */
  'cast.remove': Channel<FolderRequest & Readonly<{ id: string }>, CastDocument>;
  'cast.voice': Channel<FolderRequest & Readonly<{ voice: ProjectVoice }>, CastDocument>;
  'cast.sample': Channel<SampleRequest, VoiceSample>;
}>;
