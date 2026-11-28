import type { Expression, Pose } from '../../domain/cast/PoseAndExpression.ts';
import type { ValidatedParameters } from '../rigs/RigModel.ts';

// `head`: the label without the skin, for creatures (they keep their own skin whatever the variation chooses).
type Variation = Readonly<{ label: string; head?: string; parameters: ValidatedParameters; pose: Pose; expression: Expression; side: -1 | 1 }>;

/** Gizzy variations: skin tones, head shapes and eye colors, with other outfits and hair. */
const GIZZY: readonly Variation[] = [
  {
    label: 'oval · clara', head: 'oval', pose: 'explain', expression: 'happy', side: 1,
    parameters: { skin: 'light', headShape: 'oval', eyeColor: '#3f7fc4', hairColor: '#b4532a', freckles: true, outfit: 'hoodie', outfitColor: '#e8735a', accessoryColor: '#f6e7c8' },
  },
  {
    label: 'quadrada · marrom', head: 'quadrada', pose: 'wave', expression: 'excited', side: -1,
    parameters: { skin: 'brown', headShape: 'soft-square', eyeColor: '#4c9a5a', hairColor: '#1f1410', hair: 'bun', outfit: 'dress', outfitColor: '#6c4f9c', accessoryColor: '#f2b134' },
  },
  {
    label: 'feijão · escura', head: 'feijão', pose: 'think', expression: 'skeptical', side: 1,
    parameters: { skin: 'deep', headShape: 'bean', eyeColor: '#d09a2e', hairColor: '#120c09', glasses: true, outfitColor: '#3d8c8a', accessoryColor: '#f3efe2', cheeks: false },
  },
  {
    label: 'redonda · bege', head: 'redonda', pose: 'shrug', expression: 'surprised', side: 1,
    parameters: { skin: 'fair', headShape: 'round', eyeColor: '#7f8fa3', headwear: 'hat', outfit: 'casual', outfitColor: '#c9a227', accessoryColor: '#5a6b8c' },
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
export const VARIATIONS: Readonly<Record<string, readonly Variation[]>> = { gizzy: GIZZY, 'lia-style': LIA_STYLE };
