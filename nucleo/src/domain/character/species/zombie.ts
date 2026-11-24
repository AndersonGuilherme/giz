import type { Point } from '../../drawing/Silhouette.ts';
import { bar, blob, part, type HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { species } from './SpeciesDesign.ts';

const STITCH = { thread: 4, tick: 12 } as const;

// A stitched seam: the thread from one point to another and `ticks` short crossings along it.
function seam(from: Point, to: Point, ticks: number): HeadPart[] {
  const [dx, dy] = [to.x - from.x, to.y - from.y];
  const length = Math.hypot(dx, dy);
  const across = { x: (-dy / length) * (STITCH.tick / 2), y: (dx / length) * (STITCH.tick / 2) };
  const crossings = Array.from({ length: ticks }, (_empty, index) => {
    const share = (index + 1) / (ticks + 1);
    const at = { x: from.x + dx * share, y: from.y + dy * share };
    return part('stitch', bar({ x: at.x - across.x, y: at.y - across.y }, { x: at.x + across.x, y: at.y + across.y }, STITCH.thread));
  });
  return [part('stitch', bar(from, to, STITCH.thread)), ...crossings];
}

// A paler patch of skin on the right temple with a seam on it, and a small seam on the left cheek (away from the eyes).
function zombieParts(profile: HeadProfile): readonly HeadPart[] {
  const temple = profile.halfWidthAt(-30);
  const patch = blob([{ x: temple - 34, y: -60 }, { x: temple - 6, y: -54 }, { x: temple - 4, y: -18 }, { x: temple - 30, y: -26 }]);
  return [
    part('patch', patch),
    ...seam({ x: temple - 32, y: -56 }, { x: temple - 8, y: -22 }, 3),
    ...seam({ x: -profile.halfWidthAt(56) + 14, y: 46 }, { x: -profile.halfWidthAt(56) + 34, y: 70 }, 2),
  ];
}

/** A friendly zombie: grey-green skin, stitches, one sleepy droopy eye and torn clothes. */
export const ZOMBIE = species({ tone: 'grey-green', eyes: { droop: 0.46 }, parts: zombieParts });
