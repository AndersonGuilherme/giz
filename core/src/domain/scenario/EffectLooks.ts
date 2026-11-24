import type { Rectangle } from '../layout/Box.ts';
import type { Effect, Point } from '../script/SceneElements.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { Fps, type Frame } from '../values/Time.ts';
import { EffectCenter } from './EffectCenter.ts';
import { EffectStrength } from './EffectStrength.ts';
import { Flicker } from './Flicker.ts';
import { Particles, type Particle, type ParticleKind } from './Particles.ts';

/** Particles over the whole frame; `size` is the pixel size of a particle of relative size 1 (radius or streak length). */
export type ScreenParticleDrawing = Readonly<{ particles: readonly Particle[]; size: number }>;
export type GlowDrawing = Readonly<{ center: Point; radius: number; opacity: number }>;

type Field = Readonly<{ kind: ParticleKind; base: number; size: number; bleed: number }>;

// Per screen effect: the particle kind, how many at intensity 1, the size in units and how far the field bleeds past
// the top and bottom (a fraction of the height), so drops and flakes enter from outside instead of popping in.
const FIELDS: ReadonlyMap<string, Field> = new Map<string, Field>([
  ['particles', { kind: 'dust', base: 50, size: 5, bleed: 0 }],
  ['rain', { kind: 'rain', base: 140, size: 60, bleed: 0.1 }],
  ['snow', { kind: 'snow', base: 90, size: 7, bleed: 0.05 }],
]);
const VIGNETTE_GAIN = 1.25;
const GLOW = { radius: 620, rest: 0.85, breath: 0.15 } as const;

const unitOf = (aspect: AspectRatio): number => Math.min(aspect.width(), aspect.height()) / 1000;

function fieldArea(aspect: AspectRatio, bleed: number): Rectangle {
  const height = aspect.height();
  return { x: 0, y: -bleed * height, width: aspect.width(), height: height * (1 + 2 * bleed) };
}

/** The numbers behind each light and particle effect; the components only draw them. */
export class EffectLooks {
  static vignette(effect: Effect): number {
    return Math.min(1, EffectStrength.of(effect).intensity() * VIGNETTE_GAIN);
  }

  static tint(effect: Effect): number {
    return Math.min(1, EffectStrength.of(effect).intensity());
  }

  /** A soft light that breathes between 85% and 100% of its intensity. */
  static glow(effect: Effect, aspect: AspectRatio, frame: Frame): GlowDrawing {
    const breathing = GLOW.rest + GLOW.breath * Flicker.for('glow').at(frame);
    const opacity = Math.min(1, EffectStrength.of(effect).intensity() * breathing);
    return { center: EffectCenter.of(effect, aspect), radius: GLOW.radius * unitOf(aspect), opacity };
  }

  /** Dust (`particles`), `rain` or `snow` over the whole frame. */
  static screenParticles(effect: Effect, aspect: AspectRatio, frame: Frame): ScreenParticleDrawing {
    const field = FIELDS.get(effect.type) ?? FIELDS.get('particles')!;
    const count = EffectStrength.of(effect).count(field.base);
    const particles = Particles.for(field.kind, { seed: effect.type, count }).at(frame, Fps.DEFAULT, fieldArea(aspect, field.bleed));
    return { particles, size: field.size * unitOf(aspect) };
  }
}
