import { FACIAL_HAIRS, FacialHair, type FacialHairName } from '../../../domain/character/hair/FacialHair.ts';
import { HAIRS, HairStyle, type HairName } from '../../../domain/character/hair/HairStyle.ts';
import { HEADWEARS, Headwear, type HeadwearName } from '../../../domain/character/headwear/Headwear.ts';
import type { HeadwearPalette } from '../../../domain/character/headwear/HeadwearDesign.ts';
import { HEAD_SHAPES, type HeadShapeName } from '../../../domain/character/HeadShape.ts';
import { AUTO } from '../../../domain/character/Palette.ts';
import { SkinTone, type SkinColors, type SkinToneName } from '../../../domain/character/SkinTone.ts';
import { SPECIES, Species, type SpeciesName } from '../../../domain/character/species/Species.ts';
import type { OutfitPalette, Sleeve } from '../../../domain/character/wardrobe/OutfitDesign.ts';
import { OUTFITS, Wardrobe, type OutfitName } from '../../../domain/character/wardrobe/Wardrobe.ts';
import type { RigDefinition, ValidatedParameters } from '../RigModel.ts';
import { HeadReach } from '../../../domain/character/HeadReach.ts';
import { CHALK_WIDTH, FEET, HEAD, UNIT, VIEW_BOX } from './measures.ts';

export const gizzyDefinition: RigDefinition = {
  id: 'gizzy',
  name: { 'pt-BR': 'Gizzy', en: 'Gizzy' },
  parameters: {
    species: { type: 'option', defaultValue: Species.DEFAULT, options: [...SPECIES] },
    skin: { type: 'option', defaultValue: SkinTone.DEFAULT, options: [...SkinTone.ALL] },
    headShape: { type: 'option', defaultValue: 'round', options: [...HEAD_SHAPES] },
    eyeColor: { type: 'color', defaultValue: '#7a4a26' },
    hairColor: { type: 'color', defaultValue: '#3a2418' },
    cheeks: { type: 'boolean', defaultValue: true },
    freckles: { type: 'boolean', defaultValue: false },
    chalk: { type: 'boolean', defaultValue: true },
    // `auto` colors come from the outfit's and the headwear's own palette.
    outfitColor: { type: 'color', defaultValue: AUTO },
    outfit: { type: 'option', defaultValue: Wardrobe.DEFAULT, options: [...OUTFITS] },
    hair: { type: 'option', defaultValue: HairStyle.DEFAULT, options: [...HAIRS] },
    headwear: { type: 'option', defaultValue: Headwear.DEFAULT, options: [...HEADWEARS] },
    headwearColor: { type: 'color', defaultValue: AUTO },
    facialHair: { type: 'option', defaultValue: FacialHair.DEFAULT, options: [...FACIAL_HAIRS] },
    accessoryColor: { type: 'color', defaultValue: AUTO },
    glasses: { type: 'boolean', defaultValue: false },
    eyeScale: { type: 'number', defaultValue: 1, min: 0.8, max: 1.4 },
  },
  stance: { viewBox: VIEW_BOX, feet: { x: 200, y: FEET.y } },
  reach: (parameters) => topOf(lookOf(parameters)),
};

/** The Gizzy parameters, typed for drawing, plus the character's `id` (the seed of its chalk line). */
export type Look = Readonly<{
  id: string;
  species: SpeciesName;
  skin: SkinToneName;
  headShape: HeadShapeName;
  eyeColor: string;
  hairColor: string;
  cheeks: boolean;
  freckles: boolean;
  chalk: boolean;
  outfitColor: string;
  outfit: OutfitName;
  hair: HairName;
  headwear: HeadwearName;
  headwearColor: string;
  facialHair: FacialHairName;
  accessoryColor: string;
  glasses: boolean;
  eyeScale: number;
}>;

const defaults = Object.fromEntries(Object.entries(gizzyDefinition.parameters).map(([name, { defaultValue }]) => [name, defaultValue]));

/** Fills in the defaults: the sheet and the tests may pass only some of the parameters. */
export function lookOf(parameters: ValidatedParameters, id = 'gizzy'): Look {
  return { ...defaults, ...parameters, id } as Look;
}

// The head's highest point (hair, headwear, species features) in drawing units, lifted by the highest float, plus the chalk.
function topOf(look: Look): number {
  return HEAD.y - HeadReach.above(look) * UNIT - Species.highestFloat(look.species) - CHALK_WIDTH;
}

/** The skin colors of the look's tone (a creature's own skin, unless another creature skin was chosen). */
export function skinOf(look: Look): SkinColors {
  return SkinTone.colors(Species.skin(look.species, look.skin));
}

/** The outfit's colors, with the ones the character file chose (a creature without clothes has skin legs). */
export function outfitPaletteOf(look: Look): OutfitPalette {
  return Species.palette(look.species, Wardrobe.palette(look.outfit, { main: look.outfitColor, accent: look.accessoryColor }));
}

/** How long the sleeves are: the outfit's cut, bare on a creature without clothes. */
export const sleeveOf = (look: Look): Sleeve => Species.sleeve(look.species, Wardrobe.sleeve(look.outfit));

/** The eye size: the chosen one times the species' (big alien eyes). */
export const eyeScaleOf = (look: Look): number => Species.eyeScale(look.species, look.eyeScale);

/** The headwear's colors, with the one the character file chose. */
export function headwearPaletteOf(look: Look): HeadwearPalette {
  return Headwear.palette(look.headwear, look.headwearColor);
}

/** The accent of the outfit, for small pieces that match it (hair ties, glasses' shine). */
export const accentOf = (look: Look): string => outfitPaletteOf(look).accent;
