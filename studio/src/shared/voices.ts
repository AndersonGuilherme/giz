// The Voices stage: every line with its speaker, the state of its audio, play, make again and "gravar minha voz".
import type { CastVoiceProvider } from './cast.ts';
import type { StageBrief } from './projects.ts';

/** `done`: the audio is current; `stale`: the line changed since; `missing`: never made. */
export type VoiceState = 'done' | 'stale' | 'missing';
export type VoiceLine = Readonly<{
  lineId: string;
  number: number;
  speaker: string;
  speakerName: string;
  text: string;
  state: VoiceState;
  /** The person recorded this line (recordings/<id>.wav): the take is used instead of the project voice. */
  recorded: boolean;
  /** The line's audio to play (a giz-media URL), when there is one. */
  audio: string | null;
}>;

export type VoicesDocument = Readonly<{
  folder: string;
  provider: CastVoiceProvider;
  lines: readonly VoiceLine[];
  /** Lines to make (missing or stale) and what they cost with a paid voice (null: unknown; 0: free). */
  pending: number;
  dollars: number | null;
  stages: readonly StageBrief[];
}>;

export type VoiceProgress = Readonly<{ done: number; total: number; lineId: string }>;
export const VOICES_PROGRESS_EVENT = 'voices.progress';
/** The most a recorded take may weigh (about 10 minutes of 16-bit mono at 48 kHz). */
export const MAXIMUM_RECORDING_BYTES = 60 * 1024 * 1024;

type Channel<Request, Response> = Readonly<{ request: Request; response: Response }>;
type LineRequest = Readonly<{ folder: string; lineId: string }>;

export type VoiceChannels = Readonly<{
  'voices.read': Channel<Readonly<{ folder: string }>, VoicesDocument>;
  /** Every pending line, or `lineId` alone (made again even when current); progress on `voices.progress`; cancellable. */
  'voices.generate': Channel<Readonly<{ folder: string; lineId?: string }>, VoicesDocument>;
  'voices.cancel': Channel<Readonly<Record<string, never>>, boolean>;
  /** Saves the take (a 16-bit PCM WAV) as recordings/<id>.wav, then makes the line from it. */
  'voices.record': Channel<LineRequest & Readonly<{ wav: Uint8Array }>, VoicesDocument>;
  /** Removes the take: the line goes back to the project voice (it is made again). */
  'voices.unrecord': Channel<LineRequest, VoicesDocument>;
}>;
