import { DomainError } from '../DomainError.ts';
import { SeededNoise } from '../values/SeededNoise.ts';
import { Silhouette, type Point } from './Silhouette.ts';

// A seeded knot every 4 points, eased in between: the line drifts slowly like a hand, it does not jitter.
const KNOT_EVERY = 4;
// A closed shape is drawn a little past its start, as a chalk line that does not meet itself exactly.
const OVERSHOOT = 3;

// Traces already drawn, by seed, amplitude, spacing and outline: a still shape is traced once, not every frame.
const TRACES = new Map<string, Silhouette>();
const MAXIMUM_TRACES = 4000;

const eased = (at: number) => at * at * (3 - 2 * at);

function remembered(key: string, draw: () => Silhouette): Silhouette {
  const known = TRACES.get(key);
  if (known) return known;
  if (TRACES.size >= MAXIMUM_TRACES) TRACES.clear();
  const drawn = draw();
  TRACES.set(key, drawn);
  return drawn;
}

// Unit vector across the outline at this point (from its neighbours).
function normalAt(points: readonly Point[], index: number): Point {
  const [before, after] = [points[index - 1] ?? points[index]!, points[index + 1] ?? points[index]!];
  const [dx, dy] = [after.x - before.x, after.y - before.y];
  const length = Math.hypot(dx, dy) || 1;
  return { x: -dy / length, y: dx / length };
}

/**
 * The Gizzy chalk line: an outline redrawn by hand, each point pushed across the outline by a slow seeded wobble of up
 * to `amplitude` (in the outline's own units). The same seed always draws the same line, frame after frame.
 */
export class ChalkStroke {
  readonly #noise: SeededNoise;
  readonly #settings: Readonly<{ seed: string; amplitude: number }>;

  private constructor(noise: SeededNoise, settings: Readonly<{ seed: string; amplitude: number }>) {
    this.#noise = noise;
    this.#settings = settings;
  }

  static for(seed: string, amplitude: number): ChalkStroke {
    return new ChalkStroke(SeededNoise.for(seed), { seed, amplitude });
  }

  /** The seed of one part of one character (and side): two characters, or two hands, never wobble alike. */
  static seed(characterId: string, part: string, side?: -1 | 1): string {
    return [characterId, part, ...(side === undefined ? [] : [side])].join('/');
  }

  /** How far point `index` moves across the outline, from -amplitude to amplitude. */
  offset(index: number): number {
    const knot = Math.floor(index / KNOT_EVERY);
    const [from, to] = [this.#knot(knot), this.#knot(knot + 1)];
    return from + (to - from) * eased((index % KNOT_EVERY) / KNOT_EVERY);
  }

  /** The hand-drawn line around `silhouette`, through points about `spacing` apart; never closed exactly. */
  trace(silhouette: Silhouette, spacing: number): Silhouette {
    if (!(spacing > 0 && Number.isFinite(spacing))) throw new DomainError(`traço de giz com espaçamento ${spacing} inválido (use uma largura maior que 0)`);
    const { seed, amplitude } = this.#settings;
    return remembered(`${seed}|${amplitude}|${spacing}|${silhouette.path()}`, () => this.#drawn(silhouette, spacing));
  }

  #drawn(silhouette: Silhouette, spacing: number): Silhouette {
    const points = silhouette.points(spacing);
    const path = silhouette.closed() ? [...points, ...points.slice(1, 1 + OVERSHOOT)] : points;
    const moved = path.map((point, index) => {
      const [normal, offset] = [normalAt(path, index), this.offset(index)];
      return { x: point.x + normal.x * offset, y: point.y + normal.y * offset };
    });
    return Silhouette.through(moved, false);
  }

  #knot(index: number): number {
    return (this.#noise.fraction(index) * 2 - 1) * this.#settings.amplitude;
  }
}
