import { Silhouette } from '../drawing/Silhouette.ts';

export const HEAD_SHAPES = ['round', 'oval', 'soft-square', 'bean'] as const;
export type HeadShapeName = (typeof HEAD_SHAPES)[number];

const ORIGIN = { x: 0, y: 0 };

// In face units: centered on (0, 0), about the size of the round head (radius 100). The bean is wider at the jaw and
// dips in on the left temple.
const OUTLINES: Readonly<Record<HeadShapeName, () => Silhouette>> = {
  round: () => Silhouette.ellipse(ORIGIN, 100, 100),
  oval: () => Silhouette.ellipse(ORIGIN, 90, 108),
  'soft-square': () => Silhouette.roundedRect({ x: -98, y: -96, width: 196, height: 198 }, 46),
  bean: () => Silhouette.parse(
    'M0,-100 C58,-100 92,-72 95,-24 C98,18 104,62 78,90 C54,112 -52,112 -78,90 C-102,66 -92,30 -86,0'
    + ' C-81,-28 -98,-56 -76,-80 C-58,-98 -30,-100 0,-100 Z',
  ),
};

/** The head shapes of the giz rig; every one holds the eyes, nose and mouth at the same face positions. */
export class HeadShape {
  static outline(shape: HeadShapeName): Silhouette {
    return OUTLINES[shape]();
  }
}
