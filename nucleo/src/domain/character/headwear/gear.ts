import { blob, box, part } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import type { HeadwearDesign } from './HeadwearDesign.ts';

// A see-through band across the eyes, held by a strap round the head.
function visor(profile: HeadProfile) {
  const width = profile.halfWidthAt(0) + 10;
  const size = { width: width * 2, height: 46 };
  return [
    part('band', box({ x: 0, y: -2 }, { width: width * 2 + 8, height: 18 }, 9), 'back'),
    part('glass', box({ x: 0, y: -2 }, size, 22), 'over'),
    part('main', box({ x: -width, y: -2 }, { width: 18, height: 30 }, 9), 'over'),
    part('main', box({ x: width, y: -2 }, { width: 18, height: 30 }, 9), 'over'),
  ];
}

// A band over the top and a cup on each ear.
function headphones(profile: HeadProfile) {
  const arch = blob([...profile.arc(-174, -6, 24), ...profile.arc(-6, -174, 13)]);
  const cup = (side: -1 | 1) => box({ x: side * (profile.halfWidthAt(6) + 8), y: 6 }, { width: 30, height: 64 }, 13);
  const pad = (side: -1 | 1) => box({ x: side * (profile.halfWidthAt(6) - 2), y: 6 }, { width: 14, height: 54 }, 7);
  return [part('main', arch), part('band', pad(-1)), part('band', pad(1)), part('main', cup(-1)), part('main', cup(1))];
}

// A headscarf round the face, tied on one side (it was the `scarf` hair before the headwear parameter).
function scarf(profile: HeadProfile) {
  const [width, top] = [profile.halfWidthAt(0), profile.top()];
  const face = [
    profile.at(24, -14), { x: width * 0.7, y: -8 }, { x: profile.halfWidthAt(top * 0.5) * 0.62, y: top * 0.62 },
    { x: 0, y: top * 0.68 }, { x: -profile.halfWidthAt(top * 0.5) * 0.62, y: top * 0.62 }, { x: -width * 0.7, y: -8 }, profile.at(156, -14),
  ];
  const knot = blob([{ x: width - 6, y: 34 }, { x: width + 26, y: 42 }, { x: width + 34, y: 92 }, { x: width + 12, y: 70 }, { x: width - 4, y: 54 }]);
  return [part('band', knot, 'back'), part('main', blob([...profile.arc(156, 384, 14), ...face]))];
}

export const GEAR = {
  visor: { palette: { main: '#3b4252', accent: '#5fe0d0' }, parts: visor },
  headphones: { palette: { main: '#2f3440', accent: '#e8735a' }, parts: headphones },
  scarf: { palette: { main: '#d0573f', accent: '#a8412e' }, parts: scarf },
} as const satisfies Readonly<Record<string, HeadwearDesign>>;
