import type { HeadPart } from '../HeadPart.ts';
import { chosen } from '../Palette.ts';
import { HeadProfile } from '../HeadProfile.ts';
import type { HeadShapeName } from '../HeadShape.ts';
import { CAPS } from './caps.ts';
import { GEAR } from './gear.ts';
import { HATS } from './hats.ts';
import type { HeadwearDesign, HeadwearPalette } from './HeadwearDesign.ts';
import { HELMETS } from './helmets.ts';
import { ROYAL } from './royal.ts';

const NOTHING: HeadwearDesign = { palette: { main: '#000000', accent: '#000000' }, parts: () => [] };

const DESIGNS = {
  none: NOTHING,
  crown: ROYAL.crown,
  laurel: ROYAL.laurel,
  'viking-helmet': HELMETS['viking-helmet'],
  'knight-helmet': HELMETS['knight-helmet'],
  'pirate-hat': HATS['pirate-hat'],
  'top-hat': HATS['top-hat'],
  'flat-cap': CAPS['flat-cap'],
  beret: CAPS.beret,
  cap: CAPS.cap,
  'chef-hat': HATS['chef-hat'],
  'hard-hat': HELMETS['hard-hat'],
  'space-helmet': HELMETS['space-helmet'],
  visor: GEAR.visor,
  headphones: GEAR.headphones,
  'witch-hat': HATS['witch-hat'],
  hat: HATS.hat,
  scarf: GEAR.scarf,
} as const satisfies Readonly<Record<string, HeadwearDesign>>;

export type HeadwearName = keyof typeof DESIGNS;
export const HEADWEARS = Object.keys(DESIGNS) as HeadwearName[];

const BUILT = new Map<string, readonly HeadPart[]>();

/** Hats, helmets, crowns and gear: shapes built on the head profile, so every piece fits every head shape. */
export class Headwear {
  static readonly DEFAULT: HeadwearName = 'none';

  static parts(headwear: HeadwearName, shape: HeadShapeName): readonly HeadPart[] {
    const key = `${headwear}|${shape}`;
    const known = BUILT.get(key) ?? DESIGNS[headwear].parts(HeadProfile.of(shape));
    BUILT.set(key, known);
    return known;
  }

  /** The piece's colors; a `main` other than `auto` replaces its own. */
  static palette(headwear: HeadwearName, main: string): HeadwearPalette {
    const own = DESIGNS[headwear].palette;
    return { ...own, main: chosen(main, own.main) };
  }
}
