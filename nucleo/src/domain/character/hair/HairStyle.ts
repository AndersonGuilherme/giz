import type { HeadPart } from '../HeadPart.ts';
import { HeadProfile } from '../HeadProfile.ts';
import type { HeadShapeName } from '../HeadShape.ts';
import { HAIR_DESIGNS } from './hairStyles.ts';

export type HairName = keyof typeof HAIR_DESIGNS;
export const HAIRS = Object.keys(HAIR_DESIGNS) as HairName[];

const BUILT = new Map<string, readonly HeadPart[]>();

/** The hair styles of the giz rig: shapes in face units, built on the head shape (a cap hugs every head). */
export class HairStyle {
  static readonly DEFAULT: HairName = 'short';

  /** The hair's parts for this head shape (`back` behind the head, `front` over it); the same instances every frame. */
  static parts(hair: HairName, shape: HeadShapeName): readonly HeadPart[] {
    const key = `${hair}|${shape}`;
    const known = BUILT.get(key);
    if (known) return known;
    const parts = HAIR_DESIGNS[hair](HeadProfile.of(shape));
    BUILT.set(key, parts);
    return parts;
  }
}
