import type { Point } from '../../drawing/Silhouette.ts';
import { Silhouette } from '../../drawing/Silhouette.ts';
import { blob, part, type HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { species } from './SpeciesDesign.ts';

// A drop of goo hanging from the head outline in that direction, `length` units below it.
function drip(profile: HeadProfile, angle: number, length: number): HeadPart {
  const { x, y } = profile.at(angle, -8);
  const shape: Point[] = [{ x: x - 9, y }, { x: x + 9, y }, { x: x + 7, y: y + length * 0.7 }, { x, y: y + length }, { x: x - 7, y: y + length * 0.7 }];
  return part('goo', blob(shape));
}

// Drips along the jaw and a glossy shine on the forehead.
const slimeParts = (profile: HeadProfile): readonly HeadPart[] => [
  drip(profile, 58, 34),
  drip(profile, 118, 26),
  drip(profile, 140, 18),
  part('shine', Silhouette.ellipse({ x: -44, y: -62 }, 16, 9)),
];

/** A happy slime monster: a soft orange blob body with drips, no legs, and slightly bigger eyes (`lime` or `green` work too). */
export const SLIME_MONSTER = species({ tone: 'tangerine', legs: false, clothed: false, eyes: { scale: 1.12 }, parts: slimeParts });
