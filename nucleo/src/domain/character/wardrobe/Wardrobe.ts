import { chosen } from '../Palette.ts';
import { FUTURE_OUTFITS } from './futureOutfits.ts';
import type { Era, OutfitDesign, OutfitPalette, Sleeve } from './OutfitDesign.ts';
import { PAST_OUTFITS } from './pastOutfits.ts';
import { PRESENT_OUTFITS } from './presentOutfits.ts';

const DESIGNS = { ...PAST_OUTFITS, ...PRESENT_OUTFITS, ...FUTURE_OUTFITS } as const satisfies Readonly<Record<string, OutfitDesign>>;

export type OutfitName = keyof typeof DESIGNS;
export const OUTFITS = Object.keys(DESIGNS) as OutfitName[];

/** The colors a character file chose: `auto` keeps the outfit's own. */
export type OutfitChoice = Readonly<{ main: string; accent: string }>;

/** The giz wardrobe by era: each outfit has its sleeve length and a palette that fits it. */
export class Wardrobe {
  static readonly DEFAULT: OutfitName = 'casual';

  static ofEra(era: Era): OutfitName[] {
    return OUTFITS.filter((outfit) => DESIGNS[outfit].era === era);
  }

  static sleeve(outfit: OutfitName): Sleeve {
    return DESIGNS[outfit].sleeve;
  }

  /** The outfit's palette with the chosen colors; the parts that share the main color (sleeves, trousers) follow it. */
  static palette(outfit: OutfitName, choice: OutfitChoice): OutfitPalette {
    const own = DESIGNS[outfit].palette;
    const main = chosen(choice.main, own.main);
    const following = (color: string) => (color === own.main ? main : color);
    return { main, accent: chosen(choice.accent, own.accent), sleeve: following(own.sleeve), legs: following(own.legs), shoes: own.shoes };
  }
}
