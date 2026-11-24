import { blob, part, type HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { otherSide } from '../headwear/fit.ts';
import { species } from './SpeciesDesign.ts';

// A pointed ear behind the side of the head, the tip up and out (right ear; the left one mirrors it).
function ear(profile: HeadProfile) {
  const side = profile.halfWidthAt(6);
  return [
    { x: side - 14, y: -14 }, { x: side + 12, y: -30 }, { x: side + 30, y: -50 }, { x: side + 22, y: -14 },
    { x: side + 10, y: 18 }, { x: side - 14, y: 26 },
  ];
}

const vampireParts = (profile: HeadProfile): readonly HeadPart[] =>
  [part('ear', blob(ear(profile)), 'back'), part('ear', blob(otherSide(ear(profile))), 'back')];

/** A shy vampire: pale skin, pointed ears, two small fangs and a cape. */
export const VAMPIRE = species({ tone: 'pale', fangs: true, parts: vampireParts });
