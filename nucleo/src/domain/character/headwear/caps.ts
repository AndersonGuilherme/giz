import { Silhouette } from '../../drawing/Silhouette.ts';
import { blob, box, mirrored, part } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { dome, rimAt } from './fit.ts';
import type { HeadwearDesign } from './HeadwearDesign.ts';

// Wider and flatter than the head, puffed at the sides, with a short bill.
function flatCap(profile: HeadProfile) {
  const rim = rimAt(profile, 0.58);
  return [
    part('main', dome(profile, rim, (angle) => 10 + 12 * Math.abs(Math.cos((angle * Math.PI) / 180)))),
    part('brim', Silhouette.ellipse({ x: 0, y: rim.y + 3 }, rim.width * 0.92, 10)),
  ];
}

// A soft round cap tilted to one side, with a little stem.
function beret(profile: HeadProfile) {
  const [{ y, width }, top] = [rimAt(profile, 0.6), profile.top()];
  const body = blob([
    { x: -width - 18, y: y - 8 }, { x: -width * 0.7, y: top - 14 }, { x: width * 0.3, y: top - 24 },
    { x: width + 14, y: top + 8 }, { x: width * 0.8, y: y - 4 }, { x: -width * 0.2, y: y + 4 },
  ]);
  return [part('main', body), part('band', box({ x: -4, y: top - 24 }, { width: 7, height: 14 }, 3))];
}

// A rounded crown with a curved bill over the forehead.
function cap(profile: HeadProfile) {
  const [rim, top] = [rimAt(profile, 0.56), profile.top()];
  const bill = mirrored([{ x: 0, y: rim.y - 6 }, { x: rim.width * 0.72, y: rim.y - 4 }, { x: rim.width * 0.98, y: rim.y + 4 }, { x: rim.width * 0.6, y: rim.y + 14 }, { x: 0, y: rim.y + 18 }]);
  return [
    part('main', dome(profile, rim, 8)),
    part('brim', bill),
    part('band', Silhouette.ellipse({ x: 0, y: top - 7 }, 8, 5)),
  ];
}

export const CAPS = {
  'flat-cap': { palette: { main: '#7a6a58', accent: '#5a4c3e' }, parts: flatCap },
  beret: { palette: { main: '#b23a48', accent: '#7e2633' }, parts: beret },
  cap: { palette: { main: '#3f6fb5', accent: '#f3efe2' }, parts: cap },
} as const satisfies Readonly<Record<string, HeadwearDesign>>;
