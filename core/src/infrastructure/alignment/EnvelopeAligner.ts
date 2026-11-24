import type { Aligner } from '../../application/ports/Aligner.ts';
import type { Audio } from '../../domain/speech/Audio.ts';
import { Envelope } from '../../domain/speech/Envelope.ts';
import { Words } from '../../domain/speech/Words.ts';
import { Fps, Seconds } from '../../domain/values/Time.ts';

// charToFrame weights from the motor (scripts/tts.ts): space 0, punctuation 3 (becomes a pause), other letters 1.
const PUNCTUATION = /[,;:.!?…]/;
const letterWeight = (letter: string) => (/\s/.test(letter) ? 0 : PUNCTUATION.test(letter) ? 3 : 1);
const wordWeight = (word: string) => [...word].reduce((sum, letter) => sum + letterWeight(letter), 0);

// The voiced frames; with none, every frame of the line (the count is the envelope one).
function speechFrames(envelope: Envelope): number[] {
  const voiced = envelope.voicedFrames();
  const spoken = voiced.flatMap((hasVoice, frame) => (hasVoice ? [frame] : []));
  return spoken.length > 0 ? spoken : [...voiced.keys()];
}

// Frame where the cumulative weight falls: the start of a voiced frame, or the end of the last one.
function boundary(cumulative: number, total: number, frames: readonly number[]): number {
  const last = frames.at(-1) ?? 0;
  if (cumulative >= total) return last + 1;
  return frames[Math.floor((cumulative / total) * frames.length)] ?? last;
}

/** Without speech recognition: spreads the words over the voiced frames, in proportion to the letters. */
export class EnvelopeAligner implements Aligner {
  async align(audio: Audio, text: string): Promise<Words> {
    const words = Words.fromText(text);
    const envelope = Envelope.measure(audio, Fps.DEFAULT);
    const frames = speechFrames(envelope);
    const weights = words.texts().map(wordWeight);
    const total = Math.max(1, weights.reduce((sum, weight) => sum + weight, 0));
    const cumulatives = weights.map((_weight, index) => weights.slice(0, index + 1).reduce((sum, weight) => sum + weight, 0));
    const toSeconds = (cumulative: number) =>
      Seconds.of(Math.min(audio.duration().value(), boundary(cumulative, total, frames) / Fps.DEFAULT.value()));
    const starts = cumulatives.map((cumulative, index) => toSeconds(cumulative - (weights[index] ?? 0)));
    return words.withTimes(starts, cumulatives.map(toSeconds));
  }
}
