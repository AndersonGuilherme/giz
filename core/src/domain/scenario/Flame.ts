import type { Frame } from '../values/Time.ts';
import { Flicker } from './Flicker.ts';

/** One flame tongue in fire units, standing on y = 0: `lean` moves its tip sideways, as a fraction of its width. */
export type Tongue = Readonly<{ x: number; width: number; height: number; lean: number }>;

// Five tongues at rest, and three rings from the outer flame to the core, each a smaller copy of the one around it.
const TONGUES = [
  { x: -52, width: 28, height: 115 },
  { x: -24, width: 36, height: 175 },
  { x: 2, width: 46, height: 235 },
  { x: 30, width: 36, height: 165 },
  { x: 54, width: 26, height: 105 },
] as const;
const RING_SCALES = [1, 0.7, 0.4] as const;
// The flicker goes from 0.6 to 1 around 0.85: dividing by it stretches a tongue from 0.7× to 1.18× its rest height.
const REST_FLICKER = 0.85;
// Leaning around 0.82 makes the tips sway a little more to the right than to the left, like a breeze.
const LEAN_CENTER = 0.82;
const LEAN_GAIN = 2.5;

/** The shape of a campfire in a frame: each tongue's own flicker stretches it and swings its tip. */
export class Flame {
  static at(frame: Frame): readonly (readonly Tongue[])[] {
    const tongues = TONGUES.map((tongue, index) => ({
      ...tongue,
      stretch: Flicker.for(`tongue-${index}`).at(frame) / REST_FLICKER,
      lean: (Flicker.for(`lean-${index}`).at(frame) - LEAN_CENTER) * LEAN_GAIN,
    }));
    return RING_SCALES.map((scale) =>
      tongues.map(({ x, width, height, stretch, lean }) => ({ x: x * scale, width: width * scale, height: height * scale * stretch, lean })),
    );
  }
}
