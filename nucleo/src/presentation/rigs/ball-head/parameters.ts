import type { RigDefinition, ValidatedParameters } from '../RigModel.ts';
import { FEET, VIEW_BOX } from './measures.ts';

export const OUTFITS = ['tshirt', 'tunic', 'dress', 'hoodie'] as const;
export const HAIRS = ['none', 'bun', 'short', 'scarf', 'hat'] as const;
export type Outfit = (typeof OUTFITS)[number];
export type Hair = (typeof HAIRS)[number];

export const ballHeadDefinition: RigDefinition = {
  id: 'ball-head',
  name: { 'pt-BR': 'Cabeça-bola', en: 'Ball-head' },
  parameters: {
    headColor: { type: 'color', defaultValue: '#151515' },
    shine: { type: 'boolean', defaultValue: true },
    outfitColor: { type: 'color', defaultValue: '#3f6fb5' },
    outfit: { type: 'option', defaultValue: 'tshirt', options: [...OUTFITS] },
    hair: { type: 'option', defaultValue: 'none', options: [...HAIRS] },
    accessoryColor: { type: 'color', defaultValue: '#e8d9b5' },
    glasses: { type: 'boolean', defaultValue: false },
    eyeScale: { type: 'number', defaultValue: 1, min: 0.8, max: 1.4 },
  },
  stance: { viewBox: VIEW_BOX, feet: { x: 200, y: FEET.y } },
};

/** The ball-head parameters, typed for drawing. */
export type Look = Readonly<{
  headColor: string;
  shine: boolean;
  outfitColor: string;
  outfit: Outfit;
  hair: Hair;
  accessoryColor: string;
  glasses: boolean;
  eyeScale: number;
}>;

const defaults = Object.fromEntries(Object.entries(ballHeadDefinition.parameters).map(([name, { defaultValue }]) => [name, defaultValue]));

/** Fills in the defaults: the sheet and the tests may pass only some of the parameters. */
export function lookOf(parameters: ValidatedParameters): Look {
  return { ...defaults, ...parameters } as Look;
}
