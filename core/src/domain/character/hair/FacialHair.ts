import type { Point } from '../../drawing/Silhouette.ts';
import { blob, mirrored, part, type HeadPart } from '../HeadPart.ts';
import { HeadProfile } from '../HeadProfile.ts';
import type { HeadShapeName } from '../HeadShape.ts';

type FacialHairDesign = (profile: HeadProfile) => readonly HeadPart[];

// In face units the nose sits at y 35 and the mouth at y 62 (its widest smile spans x ±34): the mustache fits between
// them and the beard leaves the lips free; the mouth is drawn over both anyway, so lip-sync always shows.
const MUSTACHE: readonly Point[] = [{ x: 3, y: 41 }, { x: 16, y: 38 }, { x: 31, y: 42 }, { x: 40, y: 53 }, { x: 29, y: 50 }, { x: 15, y: 48 }, { x: 3, y: 48 }];

// The jaw from one cheek round the chin to the other, `grow` units over the outline, back up under the mouth.
function jaw(profile: HeadProfile, grow: number) {
  const width = profile.halfWidthAt(10);
  const chin = profile.chin();
  const inner = [
    { x: -width * 0.8, y: 8 }, { x: -width * 0.62, y: 50 }, { x: -30, y: chin - 18 }, { x: 0, y: chin - 12 },
    { x: 30, y: chin - 18 }, { x: width * 0.62, y: 50 }, { x: width * 0.8, y: 8 },
  ];
  return blob([...profile.arc(-6, 186, grow), ...inner]);
}

// Stubble only shades the lower jaw, under the cheeks, so a light skin does not look masked.
function stubble(profile: HeadProfile) {
  const [width, chin] = [profile.halfWidthAt(40), profile.chin()];
  const inner = [{ x: -width * 0.72, y: 50 }, { x: -30, y: chin - 16 }, { x: 0, y: chin - 12 }, { x: 30, y: chin - 16 }, { x: width * 0.72, y: 50 }];
  return blob([...profile.arc(24, 156, -1), ...inner]);
}

function goatee(profile: HeadProfile) {
  const chin = profile.chin();
  return mirrored([{ x: 4, y: chin - 22 }, { x: 18, y: chin - 16 }, { x: 16, y: chin - 2 }, { x: 4, y: chin + 5 }]);
}

const DESIGNS = {
  none: () => [],
  beard: (profile) => [part('hair', jaw(profile, 7)), part('hair', mirrored(MUSTACHE))],
  mustache: () => [part('hair', mirrored(MUSTACHE))],
  goatee: (profile) => [part('hair', goatee(profile)), part('hair', mirrored(MUSTACHE))],
  stubble: (profile) => [part('shadow', stubble(profile))],
} as const satisfies Readonly<Record<string, FacialHairDesign>>;

export type FacialHairName = keyof typeof DESIGNS;
export const FACIAL_HAIRS = Object.keys(DESIGNS) as FacialHairName[];

const BUILT = new Map<string, readonly HeadPart[]>();

/** Beards and mustaches on the jaw of the head shape; `shadow` parts (stubble) are drawn faint and without chalk. */
export class FacialHair {
  static readonly DEFAULT: FacialHairName = 'none';

  static parts(facialHair: FacialHairName, shape: HeadShapeName): readonly HeadPart[] {
    const key = `${facialHair}|${shape}`;
    const known = BUILT.get(key) ?? DESIGNS[facialHair](HeadProfile.of(shape));
    BUILT.set(key, known);
    return known;
  }
}
