import { DomainError } from '../DomainError.ts';
import type { Rectangle } from '../layout/Box.ts';
import { SeededNoise } from '../values/SeededNoise.ts';
import type { Fps, Frame } from '../values/Time.ts';

/** Position (in the field: 0–1 by default, or pixels of the given area), relative size (about 0.3–1.5) and opacity (0–1). */
export type Particle = Readonly<{ x: number; y: number; size: number; opacity: number }>;

export const PARTICLE_KINDS = ['embers', 'rain', 'snow', 'dust'] as const;
export type ParticleKind = (typeof PARTICLE_KINDS)[number];

/** Four fixed fractions per particle (`n0`–`n3`), drawn from the seed. */
type Traits = readonly [number, number, number, number];
type Motion = (traits: Traits, seconds: number) => Particle;

const TURN = Math.PI * 2;
const wrap = (value: number): number => value - Math.floor(value);
const clamp = (value: number): number => Math.max(0, Math.min(1, value));
const ageOf = (seconds: number, period: number, phase: number): number => wrap(seconds / period + phase);

// Embers leave the bottom of the field, sway as they rise and fade out at the top.
const embers: Motion = ([n0, n1, n2, n3], seconds) => {
  const age = ageOf(seconds, 1.6 + n0 * 1.4, n1);
  const sway = Math.sin(age * 5 + n3 * TURN) * 0.12 * age;
  return { x: clamp(0.5 + (n2 - 0.5) * 0.5 + sway), y: 1 - age, size: (0.5 + n0) * (1 - 0.5 * age), opacity: Math.sin(age * Math.PI) * (0.6 + 0.4 * n3) };
};

// Rain falls fast and a little slanted; `size` is the length of the streak.
const rain: Motion = ([n0, n1, n2, n3], seconds) => {
  const age = ageOf(seconds, 0.45 + n0 * 0.25, n1);
  return { x: wrap(n2 + age * 0.08), y: age, size: 0.6 + 0.8 * n3, opacity: 0.25 + 0.35 * n2 };
};

// Snow falls slowly and drifts from side to side.
const snow: Motion = ([n0, n1, n2, n3], seconds) => {
  const age = ageOf(seconds, 7 + n0 * 5, n1);
  return { x: wrap(n2 + Math.sin(seconds * 0.7 + n3 * TURN) * 0.03), y: age, size: 0.4 + 0.9 * n0, opacity: 0.5 + 0.5 * n3 };
};

// Dust floats in the light and twinkles.
const dust: Motion = ([n0, n1, n2, n3], seconds) => {
  const twinkle = 0.5 + 0.5 * Math.sin(seconds * 1.3 + n3 * TURN);
  return { x: wrap(n0 + seconds * 0.024 * (n1 - 0.5)), y: wrap(n2 - seconds * 0.006 * (0.5 + n1)), size: 0.3 + 0.7 * n3, opacity: 0.15 + 0.35 * twinkle };
};

const MOTIONS: ReadonlyMap<string, Motion> = new Map<string, Motion>([['embers', embers], ['rain', rain], ['snow', snow], ['dust', dust]]);

const UNIT_SQUARE: Rectangle = { x: 0, y: 0, width: 1, height: 1 };

type FieldOptions = Readonly<{ seed: string; count: number }>;

/** A field of particles whose positions depend only on the seed and the frame (no Math.random): every render is equal. */
export class Particles {
  readonly #motion: Motion;
  readonly #traits: readonly Traits[];

  private constructor(motion: Motion, traits: readonly Traits[]) {
    this.#motion = motion;
    this.#traits = traits;
  }

  static for(kind: ParticleKind, { seed, count }: FieldOptions): Particles {
    const motion = MOTIONS.get(kind);
    if (!motion) throw new DomainError(`partícula "${kind}" desconhecida (use ${PARTICLE_KINDS.join(', ')})`);
    const noise = SeededNoise.for(`${kind}:${seed}`);
    const traits = Array.from({ length: count }, (_empty, index): Traits => {
      const channel = (offset: number) => noise.fraction(index * 4 + offset);
      return [channel(0), channel(1), channel(2), channel(3)];
    });
    return new Particles(motion, traits);
  }

  /** `area` maps the field (0–1) onto a rectangle, for example the column of air above a fire, in video pixels. */
  at(frame: Frame, fps: Fps, area: Rectangle = UNIT_SQUARE): Particle[] {
    const seconds = frame.value() / fps.value();
    return this.#traits.map((traits) => {
      const particle = this.#motion(traits, seconds);
      return { ...particle, x: area.x + particle.x * area.width, y: area.y + particle.y * area.height };
    });
  }
}
