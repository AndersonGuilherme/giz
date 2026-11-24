import type { Fps } from '../values/Time.ts';
import { Motion } from './Motion.ts';

type RevealData = Readonly<{ shown: number; animatesNewest: boolean }>;

/**
 * Which items of a list a beat has revealed: the first `shown` are visible, the last of them pops in from the frame of
 * the change (when `animatesNewest`), and the rest wait hidden in their place.
 */
export class Reveal {
  readonly #data: RevealData;

  private constructor(data: RevealData) {
    this.#data = data;
  }

  static of(data: RevealData): Reveal {
    return new Reveal(data);
  }

  isVisible(index: number): boolean {
    return index < this.#data.shown;
  }

  /** 0 hidden, 1 settled; `age` counts the frames since the last change of the scene. */
  progressAt(index: number, age: number, fps: Fps): number {
    if (!this.isVisible(index)) return 0;
    const newest = index === this.#data.shown - 1;
    if (newest && this.#data.animatesNewest) return Motion.pop(age, fps);
    return 1;
  }
}
