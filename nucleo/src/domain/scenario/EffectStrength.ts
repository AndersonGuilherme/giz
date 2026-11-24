import type { Effect } from '../script/SceneElements.ts';

/** The schema refuses more; the domain clamps too, so no input can ask for thousands of particles. */
export const MAXIMUM_INTENSITY = 3;

// Without `intensity`, each effect uses the strength that looked right in the test stills.
const DEFAULT_INTENSITIES: Readonly<Partial<Record<Effect['type'], number>>> = { vignette: 0.7, tint: 0.35, glow: 0.6 };

/** How strong an effect is, from 0 to `MAXIMUM_INTENSITY` (1 = the normal amount). */
export class EffectStrength {
  readonly #intensity: number;

  private constructor(intensity: number) {
    this.#intensity = intensity;
  }

  static of(effect: Effect): EffectStrength {
    const given = effect.intensity ?? DEFAULT_INTENSITIES[effect.type] ?? 1;
    return new EffectStrength(Math.max(0, Math.min(MAXIMUM_INTENSITY, given)));
  }

  intensity(): number {
    return this.#intensity;
  }

  /** How many of something (particles, drops) for a `base` amount at intensity 1. */
  count(base: number): number {
    return Math.round(base * this.#intensity);
  }
}
