import { chosen } from '../Palette.ts';
import { FUTURE_OUTFITS } from './futureOutfits.ts';
import { BARE_LEGS, type Era, type OutfitDesign, type OutfitPalette, type Sleeve } from './OutfitDesign.ts';
import { PAST_OUTFITS } from './pastOutfits.ts';
import { PRESENT_OUTFITS } from './presentOutfits.ts';

const DESIGNS = { ...PAST_OUTFITS, ...PRESENT_OUTFITS, ...FUTURE_OUTFITS } as const satisfies Readonly<Record<string, OutfitDesign>>;

export type OutfitName = keyof typeof DESIGNS;
export const OUTFITS = Object.keys(DESIGNS) as OutfitName[];

/** The colors a character file chose: `auto` keeps the outfit's own. */
export type OutfitChoice = Readonly<{ main: string; accent: string }>;

// How far down the upper arm each sleeve reaches, as a fraction of the whole upper arm: a short sleeve stops a little past
// its middle; a long one goes past the elbow (so it joins the sleeve of the forearm).
const SLEEVE_REACH: Readonly<Record<Sleeve, number>> = { bare: 0, short: 0.52, long: 1.14 };

/** The Gizzy wardrobe by era: each outfit has its sleeve length and a palette that fits it. */
export class Wardrobe {
  static readonly DEFAULT: OutfitName = 'casual';

  static ofEra(era: Era): OutfitName[] {
    return OUTFITS.filter((outfit) => DESIGNS[outfit].era === era);
  }

  static sleeve(outfit: OutfitName): Sleeve {
    return DESIGNS[outfit].sleeve;
  }

  /** Only a long sleeve covers the forearm; shorter ones show the skin from the elbow down. */
  static coversForearm(sleeve: Sleeve): boolean {
    return sleeve === 'long';
  }

  /**
   * How far down the upper arm the sleeve reaches, in the arm's units: `upperArm` is its whole length, `visible` the
   * length seen in the pose (shorter when the arm points at the camera). A short sleeve never runs past the elbow.
   */
  static sleeveLength(sleeve: Sleeve, upperArm: number, visible: number): number {
    const reach = SLEEVE_REACH[sleeve] * upperArm;
    return Wardrobe.coversForearm(sleeve) ? visible + reach - upperArm : Math.min(visible, reach);
  }

  /** Bare legs (a toga, shorts, a short dress) are drawn in the skin color. */
  static bareLegs(palette: OutfitPalette): boolean {
    return palette.legs === BARE_LEGS;
  }

  /** Bare feet (a creature without clothes) are drawn in the skin shade. */
  static bareFeet(palette: OutfitPalette): boolean {
    return palette.shoes === BARE_LEGS;
  }

  /** The outfit's palette with the chosen colors; the parts that share the main color (sleeves, trousers) follow it. */
  static palette(outfit: OutfitName, choice: OutfitChoice): OutfitPalette {
    const own = DESIGNS[outfit].palette;
    const main = chosen(choice.main, own.main);
    const following = (color: string) => (color === own.main ? main : color);
    return { main, accent: chosen(choice.accent, own.accent), secondary: following(own.secondary), legs: following(own.legs), shoes: own.shoes };
  }
}
