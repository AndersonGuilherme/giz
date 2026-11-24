import type { Expression, Pose } from '../../domain/cast/PoseAndExpression.ts';
import type { ValidatedParameters } from '../rigs/RigModel.ts';

type Variation = Readonly<{ label: string; parameters: ValidatedParameters; pose: Pose; expression: Expression; side: -1 | 1 }>;

/** Ball-head variations: outfits, hair and headwear, glasses, eye size. */
const BALL_HEAD: readonly Variation[] = [
  {
    label: 'túnica + lenço', pose: 'hands-on-mouth', expression: 'scared', side: 1,
    parameters: { outfit: 'tunic', outfitColor: '#b4472e', hair: 'scarf', accessoryColor: '#efe6d2' },
  },
  {
    label: 'vestido + coque', pose: 'wave', expression: 'happy', side: -1,
    parameters: { outfit: 'dress', outfitColor: '#6b8f3e', hair: 'bun', accessoryColor: '#d9443a', eyeScale: 1.2 },
  },
  {
    label: 'moletom + óculos', pose: 'explain', expression: 'excited', side: 1,
    parameters: { outfit: 'hoodie', outfitColor: '#7b4fc9', hair: 'short', glasses: true, accessoryColor: '#f2c14e' },
  },
  {
    label: 'camiseta + chapéu', pose: 'think', expression: 'skeptical', side: 1,
    parameters: { outfit: 'tshirt', outfitColor: '#e0a33a', hair: 'hat', accessoryColor: '#8a6a45', shine: false },
  },
];

/** Lia-style variations: the other hair styles, emblems, skin tones and no glasses. */
const LIA_STYLE: readonly Variation[] = [
  {
    label: 'cabelo longo', pose: 'hand-on-head', expression: 'worried', side: 1,
    parameters: { hair: 'long', hairColor: '#7a4a2a', hairColor2: '#3b2216', emblem: 'none', glasses: false },
  },
  {
    label: 'raspado + código', pose: 'point', expression: 'angry', side: -1,
    parameters: { hair: 'shaved', hairColor: '#3b2a20', hairColor2: '#1d1410', skin: '#8d5a3b', hoodieColor: '#2f8f6a', hoodieShade: '#1f6b4e', emblem: 'code' },
  },
  {
    label: 'curto + estrela', pose: 'hands-on-mouth', expression: 'scared', side: 1,
    parameters: { hair: 'short', hairColor: '#f2c14e', hairColor2: '#d9822b', skin: '#e8b48a', hoodieColor: '#d9443a', hoodieShade: '#a82f27', emblem: 'star', glassesColor: '#26221c' },
  },
  {
    label: 'coque sem óculos', pose: 'shrug', expression: 'skeptical', side: 1,
    parameters: { hair: 'bun', glasses: false, browWidth: 12, browArch: 0, smile: 18 },
  },
];

/** Parameter variations shown on the sheet, per rig (each rig has its own parameters). */
export const VARIATIONS: Readonly<Record<string, readonly Variation[]>> = { 'ball-head': BALL_HEAD, 'lia-style': LIA_STYLE };
