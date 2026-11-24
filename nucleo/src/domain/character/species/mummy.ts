import { bar, blob, part, type HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { species } from './SpeciesDesign.ts';

const THICKNESS = 17;
// Bandage heights (left end, right end): above the brows and below the eyes, so the eyes and the mouth stay free
// (the mouth is drawn on top of the lower strips).
const STRIPS: readonly (readonly [number, number])[] = [[-88, -80], [-60, -70], [-52, -44], [36, 30], [56, 66], [84, 78]];

// A strip across the head at that height, a little past the outline on each side, as if it wrapped round.
function strip(profile: HeadProfile, [left, right]: readonly [number, number]): HeadPart {
  const [from, to] = [{ x: -profile.halfWidthAt(left) - 3, y: left }, { x: profile.halfWidthAt(right) + 3, y: right }];
  return part('bandage', bar(from, to, THICKNESS));
}

// A loose end hanging from the right side of the head.
const looseEnd = (profile: HeadProfile) => {
  const side = profile.halfWidthAt(-40);
  return blob([{ x: side - 6, y: -48 }, { x: side + 22, y: -40 }, { x: side + 30, y: 0 }, { x: side + 16, y: -6 }, { x: side - 6, y: -30 }]);
};

const mummyParts = (profile: HeadProfile): readonly HeadPart[] => [
  part('bandage', looseEnd(profile), 'back'),
  ...STRIPS.filter(([left, right]) => profile.halfWidthAt(left) > 20 && profile.halfWidthAt(right) > 20).map((heights) => strip(profile, heights)),
];

/** A sleepy mummy: bandages over the head and the whole body. */
export const MUMMY = species({ tone: 'linen', clothed: false, parts: mummyParts });
