import type { Effect, Point } from '../script/SceneElements.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { Placement } from './Placement.ts';

type DefaultCenter = (aspect: AspectRatio) => Point;

const middle: DefaultCenter = (aspect) => ({ x: aspect.width() / 2, y: aspect.height() / 2 });

// The fire burns on the right, a little behind the floor line (a zoom-in keeps its base in the frame), where the characters do not stand.
const DEFAULT_CENTERS: Readonly<Partial<Record<Effect['type'], DefaultCenter>>> = {
  fire: (aspect) => ({ x: aspect.width() * 0.85, y: Placement.groundOf(aspect) - aspect.height() * 0.04 }),
  glow: (aspect) => ({ x: aspect.width() / 2, y: aspect.height() * 0.35 }),
};

/** Where an effect is centered, in video pixels: its `position` (fractions of the frame) or the default of its type. */
export class EffectCenter {
  static of(effect: Effect, aspect: AspectRatio): Point {
    if (effect.position) return { x: effect.position.x * aspect.width(), y: effect.position.y * aspect.height() };
    return (DEFAULT_CENTERS[effect.type] ?? middle)(aspect);
  }
}
