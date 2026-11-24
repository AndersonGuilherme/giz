import { Silhouette } from '../../drawing/Silhouette.ts';
import { blob, box, mirrored, part } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { rimAt } from './fit.ts';
import type { HeadwearDesign } from './HeadwearDesign.ts';

// A three-cornered hat: the wide brim turned up into two side points and a low crown.
function pirate(profile: HeadProfile) {
  const [{ y, width }, top] = [rimAt(profile, 0.62), profile.top()];
  const body = mirrored([
    { x: 0, y: top - 44 }, { x: width * 0.6, y: top - 38 }, { x: width * 1.02, y: y - 48 }, { x: width * 1.55, y: y - 46 },
    { x: width * 1.36, y: y - 12 }, { x: width * 0.8, y: y + 2 }, { x: 0, y: y + 6 },
  ]);
  return [part('main', body), part('band', box({ x: 0, y: y - 6 }, { width: width * 2.2, height: 10 }, 5))];
}

function topHat(profile: HeadProfile) {
  const { y, width } = rimAt(profile, 0.66);
  return [
    part('main', box({ x: 0, y: y - 50 }, { width: width * 1.5, height: 100 }, 8)),
    part('band', box({ x: 0, y: y - 12 }, { width: width * 1.5, height: 18 }, 3)),
    part('brim', Silhouette.ellipse({ x: 0, y }, width * 1.34, 12)),
  ];
}

// A pointed cone that bends back at the tip, over a wide brim.
function witch(profile: HeadProfile) {
  const { y, width } = rimAt(profile, 0.64);
  const cone = blob([
    { x: -width * 0.8, y: y - 4 }, { x: -width * 0.45, y: y - 72 }, { x: -width * 0.02, y: y - 128 }, { x: width * 0.5, y: y - 160 },
    { x: width * 0.2, y: y - 116 }, { x: width * 0.46, y: y - 60 }, { x: width * 0.8, y: y - 4 },
  ]);
  return [
    part('brim', Silhouette.ellipse({ x: 0, y }, width * 1.6, 15)),
    part('main', cone),
    part('band', box({ x: 0, y: y - 16 }, { width: width * 1.5, height: 16 }, 3)),
  ];
}

// A puffed top over a straight band.
function chef(profile: HeadProfile) {
  const { y, width } = rimAt(profile, 0.6);
  const inner = width * 0.86;
  const puff = mirrored([
    { x: 0, y: y - 100 }, { x: inner * 0.48, y: y - 116 }, { x: inner * 1.08, y: y - 100 }, { x: inner * 1.36, y: y - 62 }, { x: inner * 0.96, y: y - 24 }, { x: 0, y: y - 24 },
  ]);
  return [part('main', puff), part('band', box({ x: 0, y: y - 12 }, { width: inner * 2, height: 28 }, 6))];
}

// A wide-brimmed hat with a band (it was the `hat` hair before the headwear parameter).
function hat(profile: HeadProfile) {
  const { y, width } = rimAt(profile, 0.78);
  const crown = blob([{ x: -width * 0.86, y: y + 2 }, { x: -width * 0.8, y: y - 52 }, { x: 0, y: y - 66 }, { x: width * 0.8, y: y - 52 }, { x: width * 0.86, y: y + 2 }]);
  return [
    part('main', crown),
    part('band', box({ x: 0, y: y - 12 }, { width: width * 1.66, height: 16 }, 3)),
    part('brim', Silhouette.ellipse({ x: 0, y: y + 2 }, width * 1.9, 16)),
  ];
}

export const HATS = {
  'pirate-hat': { palette: { main: '#2f2c38', accent: '#d9b34a' }, parts: pirate },
  'top-hat': { palette: { main: '#2b2833', accent: '#9c3b4a' }, parts: topHat },
  'witch-hat': { palette: { main: '#5b3f8c', accent: '#e8a33d' }, parts: witch },
  'chef-hat': { palette: { main: '#f7f4ec', accent: '#dcd6c8' }, parts: chef },
  hat: { palette: { main: '#c98b3a', accent: '#5a6b8c' }, parts: hat },
} as const satisfies Readonly<Record<string, HeadwearDesign>>;
