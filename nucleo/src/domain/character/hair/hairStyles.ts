import { Silhouette, type Point } from '../../drawing/Silhouette.ts';
import { blob, box, part, polygon, type HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { bumps, cap } from './hairCaps.ts';

export type HairDesign = (profile: HeadProfile) => readonly HeadPart[];

// Hair that falls behind the shoulders; the sides show past the torso.
function fallingBack(profile: HeadProfile, length: number): Silhouette {
  const width = profile.halfWidthAt(0);
  const right: Point[] = [{ x: width + 18, y: 80 }, { x: width + 12, y: length - 20 }, { x: width - 26, y: length }];
  const left = right.map(({ x, y }) => ({ x: -x, y })).reverse();
  return blob([...profile.arc(160, 380, 16), ...right, ...left]);
}

function braid(profile: HeadProfile, side: -1 | 1): HeadPart[] {
  const x = side * (profile.halfWidthAt(10) + 6);
  const knots = [30, 62, 94, 126, 158].map((y) => part('hair', Silhouette.ellipse({ x, y }, 15, 18), 'back'));
  return [...knots, part('tie', box({ x, y: 180 }, { width: 22, height: 10 }, 4), 'back')];
}

function ponytail(profile: HeadProfile): HeadPart[] {
  const [top, width] = [profile.top(), profile.halfWidthAt(0)];
  const tail = blob([
    { x: width * 0.4, y: top + 6 }, { x: width + 26, y: top + 34 }, { x: width + 44, y: 40 },
    { x: width + 30, y: 150 }, { x: width + 16, y: 104 }, { x: width + 4, y: 30 }, { x: width * 0.5, y: top + 40 },
  ]);
  const root = profile.at(-38, 12);
  return [part('hair', tail, 'back'), part('tie', Silhouette.ellipse(root, 11, 13), 'back')];
}

function mohawk(profile: HeadProfile): HeadPart[] {
  const spikes = Array.from({ length: 11 }, (_empty, index) => profile.at(-128 + index * 7.6, index % 2 === 0 ? 16 : 46));
  const crest = polygon([...spikes, ...profile.arc(-52, -128, -4)]);
  return [part('shadow', cap(profile, { hairline: 'smooth', sides: 14, grow: 2 })), part('hair', crest)];
}

const afroBack = (profile: HeadProfile) => blob([...profile.arc(-232, 52, bumps(44, 12, 9)), { x: 0, y: 70 }]);
const curlsBack = (profile: HeadProfile) => blob([...profile.arc(-212, 32, bumps(16, 10, 8)), { x: 0, y: 60 }]);

function bun(profile: HeadProfile): HeadPart[] {
  const top = profile.top();
  return [
    part('hair', Silhouette.ellipse({ x: 0, y: top - 22 }, 34, 30), 'back'),
    part('hair', cap(profile, { hairline: 'smooth', sides: 14, grow: 7 })),
    part('tie', Silhouette.ellipse({ x: 0, y: top - 2 }, 20, 7)),
  ];
}

/** Every hair style, built on the head profile: each one follows the head shape. */
export const HAIR_DESIGNS = {
  bald: () => [],
  short: (profile) => [part('hair', cap(profile, { hairline: 'fringe', sides: 12, grow: 9 }))],
  long: (profile) => [part('hair', fallingBack(profile, 200), 'back'), part('hair', cap(profile, { hairline: 'parted', sides: 6, grow: 9 }))],
  curly: (profile) => [part('hair', curlsBack(profile), 'back'), part('hair', cap(profile, { hairline: 'curls', sides: 12, grow: bumps(12, 8, 7) }))],
  afro: (profile) => [part('hair', afroBack(profile), 'back'), part('hair', cap(profile, { hairline: 'curls', sides: 14, grow: bumps(16, 8, 8) }))],
  braids: (profile) => [...braid(profile, -1), ...braid(profile, 1), part('hair', cap(profile, { hairline: 'parted', sides: 10, grow: 7 }))],
  bun,
  ponytail: (profile) => [...ponytail(profile), part('hair', cap(profile, { hairline: 'smooth', sides: 14, grow: 7 }))],
  mohawk,
} as const satisfies Readonly<Record<string, HairDesign>>;
