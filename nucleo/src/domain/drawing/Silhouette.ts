import type { Rectangle } from '../layout/Box.ts';
import { parsePath, type Path, type Point, type Segment } from './PathData.ts';

export type { Point } from './PathData.ts';

// A quarter ellipse as one cubic: the controls sit at 0.5523 of the radius.
const KAPPA = 0.5523;
// Samples per cubic when measuring its length.
const CURVE_STEPS = 24;

const add = (point: Point, x: number, y: number): Point => ({ x: point.x + x, y: point.y + y });
const lerp = (from: Point, to: Point, at: number): Point => ({ x: from.x + (to.x - from.x) * at, y: from.y + (to.y - from.y) * at });

function bezier(from: Point, segment: Extract<Segment, { kind: 'cubic' }>, at: number): Point {
  const rest = 1 - at;
  const [early, nearFirst, nearSecond, late] = [rest ** 3, 3 * rest * rest * at, 3 * rest * at * at, at ** 3];
  const { first, second, to } = segment;
  return {
    x: early * from.x + nearFirst * first.x + nearSecond * second.x + late * to.x,
    y: early * from.y + nearFirst * first.y + nearSecond * second.y + late * to.y,
  };
}

// The outline as a dense polyline: lines as they are, cubics in small steps.
const stepsOf = (from: Point, segment: Segment): Point[] => (segment.kind === 'line'
  ? [segment.to]
  : Array.from({ length: CURVE_STEPS }, (_empty, step) => bezier(from, segment, (step + 1) / CURVE_STEPS)));

function dense({ start, segments }: Path): Point[] {
  const points = [start];
  segments.forEach((segment) => points.push(...stepsOf(points.at(-1)!, segment)));
  return points;
}

function pointAt(points: readonly Point[], lengths: readonly number[], target: number): Point {
  const found = lengths.findIndex((length) => length >= target);
  const index = Math.max(1, found < 0 ? lengths.length - 1 : found);
  const span = lengths[index]! - lengths[index - 1]!;
  return lerp(points[index - 1]!, points[index]!, span > 0 ? (target - lengths[index - 1]!) / span : 0);
}

function resample(points: readonly Point[], spacing: number): Point[] {
  let walked = 0;
  const lengths = points.map((point, index) => (walked += index === 0 ? 0 : Math.hypot(point.x - points[index - 1]!.x, point.y - points[index - 1]!.y)));
  const total = lengths.at(-1)!;
  const count = Math.max(1, Math.round(total / spacing));
  const inner = Array.from({ length: count - 1 }, (_empty, step) => pointAt(points, lengths, (total * (step + 1)) / count));
  return [points[0]!, ...inner, points.at(-1)!];
}

// Catmull-Rom through the points, written as cubics.
function smooth(points: readonly Point[], closed: boolean): Segment[] {
  const at = (index: number) => points[closed ? (index + points.length) % points.length : Math.max(0, Math.min(points.length - 1, index))]!;
  const count = closed ? points.length : points.length - 1;
  return Array.from({ length: count }, (_empty, index) => {
    const [before, from, to, after] = [at(index - 1), at(index), at(index + 1), at(index + 2)];
    const first = add(from, (to.x - before.x) / 6, (to.y - before.y) / 6);
    return { kind: 'cubic', first, second: add(to, -(after.x - from.x) / 6, -(after.y - from.y) / 6), to };
  });
}

const number = (value: number) => `${Number(value.toFixed(2))}`;
const pair = ({ x, y }: Point) => `${number(x)},${number(y)}`;
const written = (segment: Segment) => (segment.kind === 'line' ? `L${pair(segment.to)}` : `C${pair(segment.first)} ${pair(segment.second)} ${pair(segment.to)}`);

/** One outline (lines and cubics) that can be sampled into points, redrawn and written as SVG path data. */
export class Silhouette {
  readonly #path: Path;

  private constructor(path: Path) {
    this.#path = path;
  }

  static parse(data: string): Silhouette {
    return new Silhouette(parsePath(data));
  }

  static ellipse(center: Point, radiusX: number, radiusY: number): Silhouette {
    const [kx, ky] = [radiusX * KAPPA, radiusY * KAPPA];
    const { x, y } = center;
    return Silhouette.parse(`M${x + radiusX},${y} C${x + radiusX},${y + ky} ${x + kx},${y + radiusY} ${x},${y + radiusY}`
      + ` C${x - kx},${y + radiusY} ${x - radiusX},${y + ky} ${x - radiusX},${y} C${x - radiusX},${y - ky} ${x - kx},${y - radiusY} ${x},${y - radiusY}`
      + ` C${x + kx},${y - radiusY} ${x + radiusX},${y - ky} ${x + radiusX},${y} Z`);
  }

  /** `corner` is the radius of the rounded corners (at most half the shorter side). */
  static roundedRect({ x, y, width, height }: Rectangle, corner: number): Silhouette {
    const radius = Math.min(corner, width / 2, height / 2);
    const [right, bottom, bend] = [x + width, y + height, radius * (1 - KAPPA)];
    return Silhouette.parse(`M${x + radius},${y} H${right - radius} C${right - bend},${y} ${right},${y + bend} ${right},${y + radius}`
      + ` V${bottom - radius} C${right},${bottom - bend} ${right - bend},${bottom} ${right - radius},${bottom}`
      + ` H${x + radius} C${x + bend},${bottom} ${x},${bottom - bend} ${x},${bottom - radius}`
      + ` V${y + radius} C${x},${y + bend} ${x + bend},${y} ${x + radius},${y} Z`);
  }

  /** A smooth curve through every point, closed back to the first one when `closed`. */
  static through(points: readonly Point[], closed: boolean): Silhouette {
    return new Silhouette({ start: points[0]!, segments: smooth(points, closed), closed });
  }

  closed(): boolean {
    return this.#path.closed;
  }

  /** Points along the outline about `spacing` apart, from the start to the end (back on the start when closed). */
  points(spacing: number): Point[] {
    return resample(dense(this.#path), spacing);
  }

  /** The same outline `factor` times larger, its (0, 0) moved to `origin`. */
  scaled(factor: number, origin: Point): Silhouette {
    const moved = (point: Point) => add(origin, point.x * factor, point.y * factor);
    const segments = this.#path.segments.map((segment): Segment => (segment.kind === 'line'
      ? { kind: 'line', to: moved(segment.to) }
      : { kind: 'cubic', first: moved(segment.first), second: moved(segment.second), to: moved(segment.to) }));
    return new Silhouette({ ...this.#path, start: moved(this.#path.start), segments });
  }

  /** SVG path data (two decimals). */
  path(): string {
    const body = [`M${pair(this.#path.start)}`, ...this.#path.segments.map(written)].join(' ');
    return this.#path.closed ? `${body} Z` : body;
  }
}
