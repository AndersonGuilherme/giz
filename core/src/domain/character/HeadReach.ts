import type { Silhouette } from '../drawing/Silhouette.ts';
import { HairStyle, type HairName } from './hair/HairStyle.ts';
import { Headwear, type HeadwearName } from './headwear/Headwear.ts';
import { HeadShape, type HeadShapeName } from './HeadShape.ts';
import { Species, type SpeciesName } from './species/Species.ts';

/** What decides how tall a head draws: its shape, hair, headwear and the species' features (antennae, a wisp). */
export type HeadLook = Readonly<{ species: SpeciesName; headwear: HeadwearName; hair: HairName; headShape: HeadShapeName }>;

const SAMPLE_SPACING = 4;
const REACHES = new Map<string, number>();

const highest = (outline: Silhouette): number => Math.min(...outline.points(SAMPLE_SPACING).map((point) => point.y));

function measured(look: HeadLook): number {
  const parts = [
    ...Species.parts(look.species, look.headShape), ...Headwear.parts(look.headwear, look.headShape), ...HairStyle.parts(look.hair, look.headShape),
  ];
  const outlines = [HeadShape.outline(look.headShape), ...parts.map((part) => part.outline)];
  return -Math.min(...outlines.map(highest));
}

/** How far up a head reaches: the `check` uses it so a tall hat or an antenna leaving the frame is noticed. */
export class HeadReach {
  /** Distance from the head center to the highest drawn point, in face units (head radius = 100), upwards positive. */
  static above(look: HeadLook): number {
    const key = `${look.species}|${look.headwear}|${look.hair}|${look.headShape}`;
    const known = REACHES.get(key) ?? measured(look);
    REACHES.set(key, known);
    return known;
  }
}
