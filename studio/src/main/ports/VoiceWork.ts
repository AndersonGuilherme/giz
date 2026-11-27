import type { CharacterVoice } from '../../shared/cast.ts';
import type { SampleVoice, SpokenSample, VoiceJob } from './MediaCore.ts';

export type SampleRequest = CharacterVoice & Readonly<{ text: string; language: 'pt-BR' | 'en' }>;

/** The heavy voice work (the local voice, Whisper): making a project's lines and saying a cast sample. */
export interface VoiceWork {
  /** Ends when the work has really ended: after a cancel, once the line in flight is done. */
  generate(folder: string, job: VoiceJob): Promise<void>;
  sample(voice: SampleVoice, request: SampleRequest): Promise<SpokenSample>;
}
