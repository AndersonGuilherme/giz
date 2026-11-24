import type { Effect, Point } from '../script/SceneElements.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { Fps, type Frame } from '../values/Time.ts';
import { EffectCenter } from './EffectCenter.ts';
import { EffectStrength } from './EffectStrength.ts';
import { Flame, type Tongue } from './Flame.ts';
import { Flicker } from './Flicker.ts';
import { Particles, type Particle } from './Particles.ts';

/** Everything a campfire draws in a frame: `scale` turns fire units into video pixels. */
export type FireDrawing = Readonly<{
  center: Point;
  scale: number;
  flame: readonly (readonly Tongue[])[];
  embers: readonly Particle[];
  light: Readonly<{ radius: number; opacity: number }>;
}>;

// The fire is drawn at 85% of a unit per fire unit; the embers rise in a 280 × 480 column that starts 80 units above the logs.
const UNITS_PER_FIRE_UNIT = 0.85;
const EMBER_COLUMN = { halfWidth: 140, top: 560, height: 480 } as const;
const EMBERS = 22;
const LIGHT = { radius: 950, opacity: 0.6 } as const;

export class FireLayout {
  static for(effect: Effect, aspect: AspectRatio, frame: Frame): FireDrawing {
    const center = EffectCenter.of(effect, aspect);
    const unit = Math.min(aspect.width(), aspect.height()) / 1000;
    const scale = unit * UNITS_PER_FIRE_UNIT * EffectStrength.of(effect).intensity();
    const area = {
      x: center.x - EMBER_COLUMN.halfWidth * scale,
      y: center.y - EMBER_COLUMN.top * scale,
      width: 2 * EMBER_COLUMN.halfWidth * scale,
      height: EMBER_COLUMN.height * scale,
    };
    const embers = Particles.for('embers', { seed: 'fire', count: EMBERS }).at(frame, Fps.DEFAULT, area);
    const light = { radius: LIGHT.radius * scale, opacity: LIGHT.opacity * Flicker.for('fire').at(frame) };
    return { center, scale, flame: Flame.at(frame), embers, light };
  }
}
