import type { Audio } from '../../domain/speech/Audio.ts';
import type { Language } from '../../domain/values/Language.ts';

/** `text` is what the voice says (the line pronunciation); `lineId` identifies the line (own recording, seed). */
export type VoiceRequest = Readonly<{ lineId: string; text: string; voice: string; language: Language; style?: string }>;

export interface VoiceProvider {
  generate(request: VoiceRequest): Promise<Audio>;
}
