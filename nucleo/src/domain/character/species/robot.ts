import { bar, box, part, type HeadPart } from '../HeadPart.ts';
import type { HeadProfile } from '../HeadProfile.ts';
import { Silhouette } from '../../drawing/Silhouette.ts';
import { species } from './SpeciesDesign.ts';

const SEAM_AT = -58;

// An antenna with a light on top, a bolt on each side of the head and a panel seam with rivets across the forehead.
function robotParts(profile: HeadProfile): readonly HeadPart[] {
  const [top, side, seam] = [profile.top(), profile.halfWidthAt(4), profile.halfWidthAt(SEAM_AT) - 10];
  return [
    part('metal', bar({ x: 0, y: top + 6 }, { x: 0, y: top - 38 }, 9), 'back'),
    part('light', Silhouette.ellipse({ x: 0, y: top - 46 }, 12, 12), 'back'),
    part('bolt', box({ x: -side - 6, y: 4 }, { width: 22, height: 44 }, 8), 'back'),
    part('bolt', box({ x: side + 6, y: 4 }, { width: 22, height: 44 }, 8), 'back'),
    part('seam', bar({ x: -seam, y: SEAM_AT }, { x: seam, y: SEAM_AT }, 3)),
    part('rivet', Silhouette.ellipse({ x: -seam + 8, y: SEAM_AT + 12 }, 4, 4)),
    part('rivet', Silhouette.ellipse({ x: seam - 8, y: SEAM_AT + 12 }, 4, 4)),
  ];
}

/** A friendly robot: a metal head, an antenna and LED eyes instead of irises. */
export const ROBOT = species({ tone: 'steel', eyes: { style: 'led' }, parts: robotParts });
