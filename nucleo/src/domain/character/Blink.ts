import type { Fps, Frame } from '../values/Time.ts';

const MINIMUM_IN_SECONDS = 2.5;
const RANGE_IN_SECONDS = 3;
const CLOSURE_PER_FRAME: readonly number[] = [0.7, 1, 1, 0.7];

function seedHash(seed: string): number {
  let hash = 2166136261;
  for (const char of seed) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}

// One-step mulberry32: mixes seed and index into a fraction in [0, 1).
function fractionOf(hash: number, index: number): number {
  let value = (hash + Math.imul(index + 1, 0x6d2b79f5)) >>> 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

/** Blinks every 2.5–5.5 s (interval fixed by the seed); each blink lasts 4 frames. */
export class Blink {
  readonly #hash: number;

  private constructor(hash: number) {
    this.#hash = hash;
  }

  static for(seed: string): Blink {
    return new Blink(seedHash(seed));
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
    const seconds = MINIMUM_IN_SECONDS + fractionOf(this.#hash, index) * RANGE_IN_SECONDS;
    return Math.round(seconds * fps.value());
  }
}
