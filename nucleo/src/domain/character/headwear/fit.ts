import type { Point, Silhouette } from '../../drawing/Silhouette.ts';
import { blob } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';

/** Where a hat sits: its rim height (a fraction of the head top) and the head's half width there. */
export type Rim = Readonly<{ y: number; width: number }>;

export function rimAt(profile: HeadProfile, fraction: number): Rim {
  const y = profile.top() * fraction;
  return { y, width: profile.halfWidthAt(y) };
}

/** The head outline above the rim, `grow` units larger, closed by the rim: helmets and caps. */
export function dome(profile: HeadProfile, rim: Rim, grow: number | ((angle: number) => number)): Silhouette {
  const above = profile.arc(-180, 0, grow).filter(({ y }) => y < rim.y);
  const growth = typeof grow === 'number' ? grow : grow(0);
  const edge = rim.width + growth;
  return blob([{ x: -edge, y: rim.y }, ...above, { x: edge, y: rim.y }, { x: 0, y: rim.y + 2 }]);
}

/** The same shape on the other side of the face (x → -x). */
export const otherSide = (points: readonly Point[]): Point[] => points.map(({ x, y }) => ({ x: -x, y }));
