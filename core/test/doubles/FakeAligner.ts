import type { Aligner } from '../../src/application/ports/Aligner.ts';
import type { Audio } from '../../src/domain/speech/Audio.ts';
import { Words } from '../../src/domain/speech/Words.ts';
import { Seconds } from '../../src/domain/values/Time.ts';

/** Splits the audio duration into equal parts, one per word of the text. */
export class FakeAligner implements Aligner {
  readonly texts: string[] = [];

  async align(audio: Audio, text: string): Promise<Words> {
    this.texts.push(text);
    const words = Words.fromText(text);
    const part = audio.duration().value() / words.texts().length;
    const starts = words.texts().map((_, i) => Seconds.of(i * part));
    const ends = words.texts().map((_, i) => Seconds.of((i + 1) * part));
    return words.withTimes(starts, ends);
  }
}
