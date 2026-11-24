import type { Expressao, Pose } from '../../dominio/elenco/PoseEExpressao.ts';
import type { ValidatedParameters } from '../rigs/RigModel.ts';

type Variation = Readonly<{ label: string; parameters: ValidatedParameters; pose: Pose; expression: Expressao; side: -1 | 1 }>;

/** Parameter variations shown on the sheet: outfits, hair and headwear, glasses, eye size. */
export const VARIATIONS: readonly Variation[] = [
  {
    label: 'túnica + lenço', pose: 'maos-na-boca', expression: 'assustada', side: 1,
    parameters: { outfit: 'tunic', outfitColor: '#b4472e', hair: 'scarf', accessoryColor: '#efe6d2' },
  },
  {
    label: 'vestido + coque', pose: 'acenar', expression: 'feliz', side: -1,
    parameters: { outfit: 'dress', outfitColor: '#6b8f3e', hair: 'bun', accessoryColor: '#d9443a', eyeScale: 1.2 },
  },
  {
    label: 'moletom + óculos', pose: 'explicar', expression: 'animada', side: 1,
    parameters: { outfit: 'hoodie', outfitColor: '#7b4fc9', hair: 'short', glasses: true, accessoryColor: '#f2c14e' },
  },
  {
    label: 'camiseta + chapéu', pose: 'pensar', expression: 'cetica', side: 1,
    parameters: { outfit: 'tshirt', outfitColor: '#e0a33a', hair: 'hat', accessoryColor: '#8a6a45', shine: false },
  },
];
