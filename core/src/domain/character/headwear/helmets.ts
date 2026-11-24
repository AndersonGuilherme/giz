import { Silhouette, type Point } from '../../drawing/Silhouette.ts';
import { blob, box, part } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { dome, otherSide, rimAt, type Rim } from './fit.ts';
import type { HeadwearDesign } from './HeadwearDesign.ts';

const band = (rim: Rim, extra: number, height: number) => box({ x: 0, y: rim.y }, { width: (rim.width + extra) * 2, height }, height / 2);

// A curved horn rising from the side of the helmet (right side; the left one mirrors it).
const horn = ({ y, width }: Rim): Point[] => [
  { x: width - 4, y: y - 34 }, { x: width + 30, y: y - 46 }, { x: width + 50, y: y - 84 }, { x: width + 50, y: y - 118 },
  { x: width + 30, y: y - 80 }, { x: width + 10, y: y - 62 }, { x: width - 8, y: y - 12 },
];

function viking(profile: HeadProfile) {
  const rim = rimAt(profile, 0.5);
  return [
    part('accent', blob(horn(rim)), 'back'),
    part('accent', blob(otherSide(horn(rim))), 'back'),
    part('main', dome(profile, rim, 9)),
    part('band', band(rim, 10, 18)),
    part('band', box({ x: 0, y: (profile.top() + rim.y) / 2 - 4 }, { width: 14, height: rim.y - profile.top() + 4 }, 7)),
  ];
}

// An open helmet: the dome down to the brows and a guard on each cheek, outside the eyes.
const guard = (profile: HeadProfile, rim: Rim): Point[] => [
  { x: 70, y: rim.y }, { x: rim.width + 12, y: rim.y }, { x: profile.halfWidthAt(20) + 12, y: 20 },
  { x: profile.halfWidthAt(52) + 8, y: 58 }, { x: 72, y: 62 },
];

function knight(profile: HeadProfile) {
  const [rim, top] = [rimAt(profile, 0.46), profile.top()];
  const plume = blob([{ x: 0, y: top - 6 }, { x: -12, y: top - 44 }, { x: 10, y: top - 76 }, { x: 34, y: top - 64 }, { x: 20, y: top - 30 }]);
  return [
    part('accent', plume, 'back'),
    part('main', dome(profile, rim, 11)),
    part('main', blob(guard(profile, rim))),
    part('main', blob(otherSide(guard(profile, rim)))),
    part('band', band(rim, 13, 14)),
  ];
}

function hardHat(profile: HeadProfile) {
  const [rim, top] = [rimAt(profile, 0.56), profile.top()];
  return [
    part('main', dome(profile, rim, 16)),
    part('accent', box({ x: 0, y: (top + rim.y) / 2 - 6 }, { width: 18, height: rim.y - top + 8 }, 8)),
    part('band', band(rim, 30, 14)),
  ];
}

// A glass bubble over the whole head (drawn over the face, see-through) on a collar at the neck.
function space(profile: HeadProfile) {
  const radius = Math.max(profile.halfWidthAt(0), -profile.top(), profile.chin()) * 1.3;
  const glass = Silhouette.ellipse({ x: 0, y: 6 }, radius, radius * 1.02);
  return [
    part('glass-back', glass, 'back'),
    part('band', box({ x: 0, y: profile.chin() + 34 }, { width: 190, height: 34 }, 17)),
    part('glass', glass, 'over'),
  ];
}

export const HELMETS = {
  'viking-helmet': { palette: { main: '#9aa5ad', accent: '#efe3c6' }, parts: viking },
  'knight-helmet': { palette: { main: '#b9c2c9', accent: '#c8423b' }, parts: knight },
  'hard-hat': { palette: { main: '#f2b134', accent: '#ffd36b' }, parts: hardHat },
  'space-helmet': { palette: { main: '#e9eef2', accent: '#8fd3ff' }, parts: space },
} as const satisfies Readonly<Record<string, HeadwearDesign>>;
