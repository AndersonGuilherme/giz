import { SeededNoise } from '../values/SeededNoise.ts';
import type { Fps, Frame } from '../values/Time.ts';

const MINIMUM_IN_SECONDS = 2.5;
const RANGE_IN_SECONDS = 3;
const CLOSURE_PER_FRAME: readonly number[] = [0.7, 1, 1, 0.7];

/** Blinks every 2.5–5.5 s (interval fixed by the seed); each blink lasts 4 frames. */
export class Blink {
  readonly #noise: SeededNoise;

  private constructor(noise: SeededNoise) {
    this.#noise = noise;
  }

  static for(seed: string): Blink {
    return new Blink(SeededNoise.for(seed));
  }

  /** 0 = eyes open, 1 = closed. */
  closureAt(frame: Frame, fps: Fps): number {
    const current = frame.value();
    let start = 0;
    let index = 0;
    while (start + this.#interval(index, fps) <= current) {
      start += this.#interval(index, fps);
      index += 1;
    }
    return index === 0 ? 0 : (CLOSURE_PER_FRAME[current - start] ?? 0);
  }

  #interval(index: number, fps: Fps): number {
    const seconds = MINIMUM_IN_SECONDS + this.#noise.fraction(index) * RANGE_IN_SECONDS;
    return Math.round(seconds * fps.value());
  }
}
