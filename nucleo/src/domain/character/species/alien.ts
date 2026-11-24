import type { Point } from '../../drawing/Silhouette.ts';
import { Silhouette } from '../../drawing/Silhouette.ts';
import { bar, part, type HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { species } from './SpeciesDesign.ts';

// Two antennae from the top of the head, leaning out, each with a ball at the tip.
function antenna(profile: HeadProfile, side: -1 | 1): HeadPart[] {
  const root = profile.at(-90 + side * 26, -6);
  const tip: Point = { x: root.x + side * 26, y: profile.top() - 52 };
  return [part('stalk', bar(root, tip, 7), 'back'), part('light', Silhouette.ellipse(tip, 11, 11), 'back')];
}

const alienParts = (profile: HeadProfile): readonly HeadPart[] => [...antenna(profile, -1), ...antenna(profile, 1)];

/** A curious alien: big eyes, two antennae and a colored skin (green by default; lilac works too). */
export const ALIEN = species({ tone: 'green', eyes: { scale: 1.3 }, parts: alienParts });
