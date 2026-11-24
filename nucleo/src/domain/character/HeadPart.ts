import { Silhouette, type Point } from '../drawing/Silhouette.ts';

/** `back` is drawn behind the head, `front` over the head and under the face, `over` on top of the face (glass, visors). */
export type HeadLayer = 'back' | 'front' | 'over';

/** One shape worn on the head, in face units: `role` tells the drawing how to paint it (hair, tie, brim, glass…). */
export type HeadPart = Readonly<{ role: string; outline: Silhouette; layer: HeadLayer }>;

export const part = (role: string, outline: Silhouette, layer: HeadLayer = 'front'): HeadPart => ({ role, outline, layer });

/** A closed smooth shape through the points. */
export const blob = (points: readonly Point[]): Silhouette => Silhouette.through(points, true);

/** A closed shape through the points mirrored on the other side of x = 0 (give the right half, top to bottom). */
export function mirrored(rightHalf: readonly Point[]): Silhouette {
  const left = [...rightHalf].reverse().map(({ x, y }) => ({ x: -x, y }));
  return Silhouette.through([...rightHalf, ...left], true);
}

/** A pointed leaf, `length` long along `angle` (degrees), centered on `center`. */
export function leaf(center: Point, angle: number, size: Readonly<{ length: number; width: number }>): Silhouette {
  const [along, across] = [(angle * Math.PI) / 180, ((angle + 90) * Math.PI) / 180];
  const step = (direction: number, distance: number) => ({ x: Math.cos(direction) * distance, y: Math.sin(direction) * distance });
  const [tip, side] = [step(along, size.length / 2), step(across, size.width / 2)];
  return Silhouette.through([
    { x: center.x + tip.x, y: center.y + tip.y },
    { x: center.x + side.x, y: center.y + side.y },
    { x: center.x - tip.x, y: center.y - tip.y },
    { x: center.x - side.x, y: center.y - side.y },
  ], true);
}

/** A rectangle with rounded corners, from its center. */
export const box = (center: Point, size: Readonly<{ width: number; height: number }>, corner: number): Silhouette =>
  Silhouette.roundedRect({ x: center.x - size.width / 2, y: center.y - size.height / 2, ...size }, corner);

/** A closed shape with straight sides through the points (spikes, zigzags). */
export const polygon = (points: readonly Point[]): Silhouette =>
  Silhouette.parse(`M${points.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L')} Z`);

/** A straight strip `thickness` wide from one point to another (stitches, seams, bandages, antenna stalks). */
export function bar(from: Point, to: Point, thickness: number): Silhouette {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const across = { x: (-(to.y - from.y) / length) * (thickness / 2), y: ((to.x - from.x) / length) * (thickness / 2) };
  return polygon([
    { x: from.x + across.x, y: from.y + across.y }, { x: to.x + across.x, y: to.y + across.y },
    { x: to.x - across.x, y: to.y - across.y }, { x: from.x - across.x, y: from.y - across.y },
  ]);
}
