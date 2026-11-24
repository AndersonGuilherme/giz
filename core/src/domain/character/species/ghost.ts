import { leaf, part, type HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { species } from './SpeciesDesign.ts';

// A little curl of mist on top of the head.
const ghostParts = (profile: HeadProfile): readonly HeadPart[] =>
  [part('wisp', leaf({ x: 10, y: profile.top() - 4 }, -60, { length: 46, width: 22 }), 'back')];

/** A gentle ghost: see-through, no legs, floating a little above the ground with a slow bob. */
export const GHOST = species({
  tone: 'mist', legs: false, clothed: false, opacity: 0.84, float: { height: 46, bob: 7, period: 2.6 }, parts: ghostParts,
});
