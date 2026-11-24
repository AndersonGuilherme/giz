import type { RigDefinition, ValidatedParameters } from '../RigModel.ts';
import { SOLES, VIEW_BOX } from './measures.ts';

export const HAIRS = ['long', 'short', 'shaved', 'bun'] as const;
export const EMBLEMS = ['star', 'code', 'none'] as const;
export type Hair = (typeof HAIRS)[number];
export type Emblem = (typeof EMBLEMS)[number];

// The defaults are Lia's look from the old motor (`motor/src/Character.tsx` palette and `cast.ts`).
export const liaStyleDefinition: RigDefinition = {
  id: 'lia-style',
  name: { 'pt-BR': 'Estilo Lia', en: 'Lia style' },
  parameters: {
    skin: { type: 'color', defaultValue: '#FDD6B0' },
    hairColor: { type: 'color', defaultValue: '#E817DF' },
    hairColor2: { type: 'color', defaultValue: '#6D1AE6' },
    hair: { type: 'option', defaultValue: 'bun', options: [...HAIRS] },
    hoodieColor: { type: 'color', defaultValue: '#8B3FF5' },
    hoodieShade: { type: 'color', defaultValue: '#6A22D6' },
    emblem: { type: 'option', defaultValue: 'star', options: [...EMBLEMS] },
    glasses: { type: 'boolean', defaultValue: true },
    glassesColor: { type: 'color', defaultValue: '#6D1AE6' },
    browWidth: { type: 'number', defaultValue: 7, min: 5, max: 12 },
    browArch: { type: 'number', defaultValue: 7, min: 0, max: 9 },
    smile: { type: 'number', defaultValue: 30, min: 18, max: 34 },
  },
  stance: { viewBox: VIEW_BOX, feet: SOLES },
};

/** The lia-style parameters, typed for drawing; `hairColor` → `hairColor2` is the hair gradient. */
export type Look = Readonly<{
  skin: string;
  hairColor: string;
  hairColor2: string;
  hair: Hair;
  hoodieColor: string;
  hoodieShade: string;
  emblem: Emblem;
  glasses: boolean;
  glassesColor: string;
  browWidth: number;
  browArch: number;
  smile: number;
}>;

const defaults = Object.fromEntries(Object.entries(liaStyleDefinition.parameters).map(([name, { defaultValue }]) => [name, defaultValue]));

/** Fills in the defaults: the sheet and the tests may pass only some of the parameters. */
export function lookOf(parameters: ValidatedParameters): Look {
  return { ...defaults, ...parameters } as Look;
}
