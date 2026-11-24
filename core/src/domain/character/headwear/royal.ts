import { Silhouette } from '../../drawing/Silhouette.ts';
import { box, leaf, part, polygon } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { rimAt } from './fit.ts';
import type { HeadwearDesign } from './HeadwearDesign.ts';

// Five points, the middle one tallest, on a band over the forehead.
function crown(profile: HeadProfile) {
  const rim = rimAt(profile, 0.72);
  const width = rim.width * 0.84;
  const peaks = [50, 38, 60, 38, 50];
  const outline = peaks.flatMap((height, index) => {
    const x = -width + (width * index) / 2;
    const valley = index < 4 ? [{ x: x + width / 4, y: rim.y - 26 }] : [];
    return [{ x, y: rim.y - height }, ...valley];
  });
  const gems = [-width / 2, 0, width / 2].map((x) => part('gem', Silhouette.ellipse({ x, y: rim.y - 8 }, 6, 5)));
  return [
    part('main', polygon([{ x: -width, y: rim.y }, ...outline, { x: width, y: rim.y }])),
    part('band', box({ x: 0, y: rim.y - 8 }, { width: width * 2 + 6, height: 18 }, 5)),
    ...gems,
  ];
}

// Leaves along both sides of the head, pointing back over the top.
function laurel(profile: HeadProfile) {
  const angles = [-205, -188, -171, -154, -137, -120, -60, -43, -26, -9, 8, 25];
  return angles.map((angle, index) => part(index % 2 === 0 ? 'leaf' : 'leaf-dark', leaf(profile.at(angle, 6), angle + (angle < -90 ? -70 : 70), { length: 30, width: 13 })));
}

export const ROYAL = {
  crown: { palette: { main: '#f2c14e', accent: '#d64550' }, parts: crown },
  laurel: { palette: { main: '#7aa35a', accent: '#557a3c' }, parts: laurel },
} as const satisfies Readonly<Record<string, HeadwearDesign>>;
