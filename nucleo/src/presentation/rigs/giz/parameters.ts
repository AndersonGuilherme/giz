import { HEAD_SHAPES, type HeadShapeName } from '../../../domain/character/HeadShape.ts';
import { SKIN_TONES, SkinTone, type SkinColors, type SkinToneName } from '../../../domain/character/SkinTone.ts';
import type { RigDefinition, ValidatedParameters } from '../RigModel.ts';
import { FEET, VIEW_BOX } from './measures.ts';

export const OUTFITS = ['tshirt', 'tunic', 'dress', 'hoodie'] as const;
export const HAIRS = ['none', 'bun', 'short', 'scarf', 'hat'] as const;
export type Outfit = (typeof OUTFITS)[number];
export type Hair = (typeof HAIRS)[number];

export const gizDefinition: RigDefinition = {
  id: 'giz',
  name: { 'pt-BR': 'Giz', en: 'Giz' },
  parameters: {
    skin: { type: 'option', defaultValue: SkinTone.DEFAULT, options: [...SKIN_TONES] },
    headShape: { type: 'option', defaultValue: 'round', options: [...HEAD_SHAPES] },
    eyeColor: { type: 'color', defaultValue: '#7a4a26' },
    hairColor: { type: 'color', defaultValue: '#3a2418' },
    cheeks: { type: 'boolean', defaultValue: true },
    freckles: { type: 'boolean', defaultValue: false },
    chalk: { type: 'boolean', defaultValue: true },
    outfitColor: { type: 'color', defaultValue: '#2f8f83' },
    outfit: { type: 'option', defaultValue: 'tshirt', options: [...OUTFITS] },
    hair: { type: 'option', defaultValue: 'short', options: [...HAIRS] },
    accessoryColor: { type: 'color', defaultValue: '#f2b134' },
    glasses: { type: 'boolean', defaultValue: false },
    eyeScale: { type: 'number', defaultValue: 1, min: 0.8, max: 1.4 },
  },
  stance: { viewBox: VIEW_BOX, feet: { x: 200, y: FEET.y } },
};

/** The giz parameters, typed for drawing. */
export type Look = Readonly<{
  skin: SkinToneName;
  headShape: HeadShapeName;
  eyeColor: string;
  hairColor: string;
  cheeks: boolean;
  freckles: boolean;
  chalk: boolean;
  outfitColor: string;
  outfit: Outfit;
  hair: Hair;
  accessoryColor: string;
  glasses: boolean;
  eyeScale: number;
}>;

const defaults = Object.fromEntries(Object.entries(gizDefinition.parameters).map(([name, { defaultValue }]) => [name, defaultValue]));

/** Fills in the defaults: the sheet and the tests may pass only some of the parameters. */
export function lookOf(parameters: ValidatedParameters): Look {
  return { ...defaults, ...parameters } as Look;
}

/** The skin colors of the look's tone. */
export function skinOf(look: Look): SkinColors {
  return SkinTone.colors(look.skin);
}
