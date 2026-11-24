import type { RigDefinition, ValidatedParameters } from '../RigModel.ts';

export const OUTFITS = ['tshirt', 'tunic', 'dress', 'hoodie'] as const;
export const HAIRS = ['none', 'bun', 'short', 'scarf', 'hat'] as const;
export type Outfit = (typeof OUTFITS)[number];
export type Hair = (typeof HAIRS)[number];

export const ballHeadDefinition: RigDefinition = {
  id: 'ball-head',
  name: { 'pt-BR': 'Cabeça-bola', en: 'Ball-head' },
  parameters: {
    headColor: { tipo: 'cor', padrao: '#151515' },
    shine: { tipo: 'booleano', padrao: true },
    outfitColor: { tipo: 'cor', padrao: '#3f6fb5' },
    outfit: { tipo: 'opcao', padrao: 'tshirt', opcoes: [...OUTFITS] },
    hair: { tipo: 'opcao', padrao: 'none', opcoes: [...HAIRS] },
    accessoryColor: { tipo: 'cor', padrao: '#e8d9b5' },
    glasses: { tipo: 'booleano', padrao: false },
    eyeScale: { tipo: 'numero', padrao: 1, min: 0.8, max: 1.4 },
  },
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

const defaults = Object.fromEntries(Object.entries(ballHeadDefinition.parameters).map(([name, { padrao }]) => [name, padrao]));

/** Fills in the defaults: the sheet and the tests may pass only some of the parameters. */
export function lookOf(parameters: ValidatedParameters): Look {
  return { ...defaults, ...parameters } as Look;
}
