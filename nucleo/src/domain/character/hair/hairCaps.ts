import type { Point, Silhouette } from '../../drawing/Silhouette.ts';
import { blob } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';

/** How the hair meets the forehead, from the right temple to the left one. */
export type Hairline = 'fringe' | 'smooth' | 'parted' | 'curls';

/** `sides`: how many degrees above the ears the cap stops; `grow`: its thickness over the head outline. */
export type CapStyle = Readonly<{ hairline: Hairline; sides: number; grow: number | ((angle: number) => number) }>;

// The hairline sits at this fraction of the head top: below it the forehead stays free for the brows.
const HAIRLINE_HEIGHT = 0.6;
// How wide the hairline runs, as a fraction of the head width at that height.
const HAIRLINE_WIDTH = 0.72;

type Across = Readonly<{ width: number; y: number }>;

const across = (profile: HeadProfile): Across => {
  const y = profile.top() * HAIRLINE_HEIGHT;
  return { width: profile.halfWidthAt(y) * HAIRLINE_WIDTH, y };
};

const spread = (count: number, { width }: Across) => Array.from({ length: count }, (_empty, index) => width - (2 * width * index) / (count - 1));

// Each style gives the inner edge over the forehead, right to left.
const HAIRLINES: Readonly<Record<Hairline, (line: Across) => Point[]>> = {
  fringe: (line) => spread(7, line).map((x, index) => ({ x, y: line.y + (index % 2 === 0 ? -2 : 7) })),
  smooth: (line) => spread(5, line).map((x) => ({ x, y: line.y - 10 + (x / line.width) ** 2 * 12 })),
  parted: (line) => spread(5, line).map((x) => ({ x, y: line.y + 6 - (1 - Math.abs(x) / line.width) * 20 })),
  curls: (line) => spread(9, line).map((x, index) => ({ x, y: line.y + (index % 2 === 0 ? -4 : 8) })),
};

/** The inner edge of the cap over the forehead, right to left (also where a fringe of curls or a headband sits). */
export function hairline(profile: HeadProfile, style: Hairline): Point[] {
  return HAIRLINES[style](across(profile));
}

/** A cap of hair over the top of the head, from one side to the other, closed by the hairline across the forehead. */
export function cap(profile: HeadProfile, style: CapStyle): Silhouette {
  const [left, right] = [-180 + style.sides, -style.sides];
  const outer = profile.arc(left, right, style.grow);
  const temples = [profile.at(right, -8), profile.at(-30, -12)];
  const otherTemples = [profile.at(-150, -12), profile.at(left, -8)];
  return blob([...outer, ...temples, ...hairline(profile, style.hairline), ...otherTemples]);
}

/** Bumps along an arc: `base` units over the head, `height` more at each of `count` bumps. */
export const bumps = (base: number, height: number, count: number) => (angle: number) =>
  base + height * Math.abs(Math.sin((angle * Math.PI * count) / 180));
