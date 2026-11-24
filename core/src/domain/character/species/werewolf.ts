import type { Point } from '../../drawing/Silhouette.ts';
import { blob, part, polygon, type HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { otherSide } from '../headwear/fit.ts';
import { species } from './SpeciesDesign.ts';

// A furry ear on top of the head, behind it (right ear; the left one mirrors it); the inner ear is a smaller copy.
const ear = (profile: HeadProfile, size: number): Point[] =>
  [profile.at(-80, -10), profile.at(-58, 56 * size), profile.at(-30, -10), profile.at(-55, 4)];

// Tufts of fur along the cheeks: a zigzag just outside the head, from the eyes down to the jaw (right side).
const tufts = (profile: HeadProfile): Point[] => [
  profile.at(-4, -6), ...[0, 12, 24, 36, 48, 60].map((angle, index) => profile.at(angle + 6, index % 2 === 0 ? 18 : 2)), profile.at(68, -6),
];

// A lighter muzzle round the nose and mouth, and a bigger nose.
const muzzle = blob([{ x: 0, y: 18 }, { x: 40, y: 40 }, { x: 34, y: 80 }, { x: 0, y: 88 }, { x: -34, y: 80 }, { x: -40, y: 40 }]);
const nose = blob([{ x: -13, y: 28 }, { x: 13, y: 28 }, { x: 6, y: 42 }, { x: -6, y: 42 }]);

function werewolfParts(profile: HeadProfile): readonly HeadPart[] {
  return [
    part('fur', polygon(tufts(profile)), 'back'),
    part('fur', polygon(otherSide(tufts(profile))), 'back'),
    part('fur', blob(ear(profile, 1)), 'back'),
    part('fur', blob(otherSide(ear(profile, 1))), 'back'),
    part('inner', blob(ear(profile, 0.6)), 'back'),
    part('inner', blob(otherSide(ear(profile, 0.6))), 'back'),
    part('muzzle', muzzle),
    part('nose', nose),
  ];
}

/** A cuddly werewolf: fur ears, cheek tufts, a hint of snout and claws on the hands. */
export const WEREWOLF = species({ tone: 'fur', parts: werewolfParts });
