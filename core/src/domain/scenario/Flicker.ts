import { SeededNoise } from '../values/SeededNoise.ts';
import type { Frame } from '../values/Time.ts';

const BASE = 0.85;
// Two slow waves give the breathing of the flame; the noise, held for 2 frames, gives the crackle.
const WAVES = [
  { amplitude: 0.07, speed: 0.31, phase: 0 },
  { amplitude: 0.04, speed: 0.73, phase: 1.3 },
] as const;
const CRACKLE = 0.08;
const FRAMES_PER_CRACKLE = 2;

/** How bright a flame is in a frame, from 0.6 to 1; the seed keeps two fires from flickering together. */
export class Flicker {
  readonly #noise: SeededNoise;

  private constructor(noise: SeededNoise) {
    this.#noise = noise;
  }

  static for(seed: string): Flicker {
    return new Flicker(SeededNoise.for(seed));
  }

  at(frame: Frame): number {
    const number = frame.value();
    const offset = this.#noise.fraction(0) * 10;
    const waves = WAVES.reduce((sum, wave) => sum + wave.amplitude * Math.sin(number * wave.speed + wave.phase + offset), 0);
    const crackle = (this.#noise.fraction(1 + Math.floor(number / FRAMES_PER_CRACKLE)) - 0.5) * CRACKLE;
    return Math.max(0.6, Math.min(1, BASE + waves + crackle));
  }
}
