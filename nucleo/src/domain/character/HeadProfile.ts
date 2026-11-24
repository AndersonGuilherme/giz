import type { Point } from '../drawing/Silhouette.ts';
import { HeadShape, type HeadShapeName } from './HeadShape.ts';

/** A direction from the head center in degrees, SVG style (y grows down): 0 right, -90 top, 90 chin, ±180 left. */
type Polar = Readonly<{ angle: number; radius: number }>;

const SAMPLE_SPACING = 1.5;
// Arcs are drawn through a point every few degrees: enough to follow the corners of the soft-square head.
const ARC_STEP = 8;
const PROFILES = new Map<HeadShapeName, HeadProfile>();

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const wrapped = (angle: number) => ((((angle + 180) % 360) + 360) % 360) - 180;

// Sorted by angle, with the last sample repeated before -180 and the first after 180, so every angle has two neighbours.
function polarOf(points: readonly Point[]): Polar[] {
  const polar = points.map(({ x, y }) => ({ angle: (Math.atan2(y, x) * 180) / Math.PI, radius: Math.hypot(x, y) }));
  const sorted = polar.sort((first, second) => first.angle - second.angle);
  return [{ ...sorted.at(-1)!, angle: sorted.at(-1)!.angle - 360 }, ...sorted, { ...sorted[0]!, angle: sorted[0]!.angle + 360 }];
}

function interpolate(samples: readonly Polar[], angle: number): number {
  const after = Math.max(1, samples.findIndex((sample) => sample.angle >= angle));
  const [before, next] = [samples[after - 1]!, samples[after]!];
  const span = next.angle - before.angle;
  return span > 0 ? before.radius + ((next.radius - before.radius) * (angle - before.angle)) / span : before.radius;
}

/**
 * The head outline seen from its center, in face units: hair, headwear and beards are built on it, so they follow
 * every head shape (a cap hugs the oval, a brim takes the width of the soft-square).
 */
export class HeadProfile {
  readonly #samples: readonly Polar[];

  private constructor(samples: readonly Polar[]) {
    this.#samples = samples;
  }

  static of(shape: HeadShapeName): HeadProfile {
    const known = PROFILES.get(shape);
    if (known) return known;
    const profile = new HeadProfile(polarOf(HeadShape.outline(shape).points(SAMPLE_SPACING)));
    PROFILES.set(shape, profile);
    return profile;
  }

  /** How far the outline is from the center in that direction. */
  radiusAt(angle: number): number {
    return interpolate(this.#samples, wrapped(angle));
  }

  /** The outline point in that direction, pushed `grow` units outward (negative: inward). */
  at(angle: number, grow = 0): Point {
    const radius = this.radiusAt(angle) + grow;
    return { x: Math.cos(radians(angle)) * radius, y: Math.sin(radians(angle)) * radius };
  }

  /** Outline points from one direction to another (either way round), `grow` units outward, `grow` may vary along it. */
  arc(from: number, to: number, grow: number | ((angle: number) => number) = 0): Point[] {
    const steps = Math.max(2, Math.ceil(Math.abs(to - from) / ARC_STEP));
    const growth = typeof grow === 'number' ? () => grow : grow;
    return Array.from({ length: steps + 1 }, (_empty, step) => from + ((to - from) * step) / steps)
      .map((angle) => this.at(angle, growth(angle)));
  }

  /** The height of the top of the head (negative: above the center). */
  top(): number {
    return this.at(-90).y;
  }

  /** The height of the chin. */
  chin(): number {
    return this.at(90).y;
  }

  /** Half the width of the head at height `y` (its wider side), 0 above the top or below the chin. */
  halfWidthAt(y: number): number {
    if (y < this.top() || y > this.chin()) return 0;
    const points = Array.from({ length: 360 }, (_empty, degree) => this.at(degree - 180));
    const nearest = (side: number) => points
      .filter(({ x }) => x * side >= 0)
      .reduce((best, point) => (Math.abs(point.y - y) < Math.abs(best.y - y) ? point : best));
    return Math.max(nearest(1).x, -nearest(-1).x);
  }
}
