import type { Audio } from '../../domain/speech/Audio.ts';
import type { WordJson } from '../../domain/speech/WordJson.ts';

/** What is saved for each line, in `voice/<id>.json`; the audio is in `file` (`voice/<id>.wav`). */
export type RecordedVoice = {
  file: string;
  hash: string;
  durationSeconds: number;
  envelope: number[];
  visemes: string;
  words?: WordJson[];
};

/** Path of the line audio, relative to the project folder. */
export const voiceFile = (lineId: string): string => `voice/${lineId}.wav`;

export interface VoiceStore {
  /** The hash of the voice already saved for the line, or `undefined` if it has no voice yet. */
  savedHash(lineId: string): string | undefined;
  save(lineId: string, record: RecordedVoice, audio: Audio): Promise<void>;
  read(lineId: string): Promise<RecordedVoice>;
}
