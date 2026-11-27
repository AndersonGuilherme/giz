import type { CostEstimate } from '../../domain/ai/CostEstimate.ts';
import type { Audio } from '../../domain/speech/Audio.ts';
import type { Language } from '../../domain/values/Language.ts';

/** `text` is what the voice says (the line pronunciation); `lineId` identifies the line (own recording, seed). */
export type VoiceRequest = Readonly<{ lineId: string; text: string; voice: string; language: Language; style?: string }>;

export interface VoiceProvider {
  generate(request: VoiceRequest): Promise<Audio>;
  /**
   * What, beyond the request, decides the audio of the line (a recording: the content of its file), so that a change
   * there generates the line again. Absent or empty: nothing beyond the request.
   */
  fingerprint?(request: VoiceRequest): Promise<string>;
  /** What generating the line costs, before calling (the text the service bills, its model). Absent: free (local). */
  estimate?(request: VoiceRequest): CostEstimate;
}
