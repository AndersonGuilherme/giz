export const SKIN_TONES = ['light', 'fair', 'medium', 'tan', 'brown', 'deep'] as const;
/** Fantasy skins for creatures: each species has its own, and any creature may take another one. */
export const CREATURE_TONES = ['grey-green', 'pale', 'fur', 'linen', 'mist', 'steel', 'green', 'lilac', 'lime', 'tangerine'] as const;
export type HumanToneName = (typeof SKIN_TONES)[number];
export type CreatureToneName = (typeof CREATURE_TONES)[number];
export type SkinToneName = HumanToneName | CreatureToneName;

/** `base` fills the skin, `shade` the side away from the light, `line` the closed mouth, nose and eye rims, `blush` the cheeks. */
export type SkinColors = Readonly<{ base: string; shade: string; line: string; blush: string }>;

// The giz palette, light to deep, then the creature skins. Every line color keeps a clear contrast with its base, and
// no tone is black.
const TONES: Readonly<Record<SkinToneName, SkinColors>> = {
  light: { base: '#f8dcc8', shade: '#ebc2a8', line: '#7a3f33', blush: '#f2a08f' },
  fair: { base: '#efc19c', shade: '#dea47f', line: '#6e3626', blush: '#ec8d74' },
  medium: { base: '#d89b6c', shade: '#c18053', line: '#5a2b1c', blush: '#e07a5c' },
  tan: { base: '#b87b4f', shade: '#9f643c', line: '#45200f', blush: '#d0694b' },
  brown: { base: '#916041', shade: '#7a4c30', line: '#2e140a', blush: '#c25e45' },
  deep: { base: '#714a33', shade: '#5e3b27', line: '#1c0c05', blush: '#a9503c' },
  'grey-green': { base: '#a3bc98', shade: '#89a37f', line: '#34452f', blush: '#c79aa6' },
  pale: { base: '#ece6f1', shade: '#d6cce0', line: '#4d3a5a', blush: '#eaa2ba' },
  fur: { base: '#a07e5c', shade: '#866647', line: '#382414', blush: '#cf8466' },
  linen: { base: '#ece1c6', shade: '#d6c7a4', line: '#6a5532', blush: '#e6b28c' },
  mist: { base: '#eef6fb', shade: '#d3e3ee', line: '#4a6378', blush: '#f3b3c6' },
  steel: { base: '#b9c5cd', shade: '#9aa8b2', line: '#33414b', blush: '#f0a3ab' },
  green: { base: '#94d68c', shade: '#76bd70', line: '#28562a', blush: '#e99da6' },
  lilac: { base: '#bba6e4', shade: '#9f89cd', line: '#3d2a64', blush: '#f09cc2' },
  lime: { base: '#addf62', shade: '#8cc443', line: '#365e14', blush: '#f2a39c' },
  tangerine: { base: '#f4a65c', shade: '#df8a3e', line: '#6a3210', blush: '#ee7a70' },
};

const CREATURES: ReadonlySet<string> = new Set(CREATURE_TONES);

/** The giz skin palette: the default characters have a skin tone, from light to deep; creatures have fantasy skins. */
export class SkinTone {
  static readonly DEFAULT: SkinToneName = 'medium';
  static readonly ALL: readonly SkinToneName[] = [...SKIN_TONES, ...CREATURE_TONES];

  static colors(tone: SkinToneName): SkinColors {
    return TONES[tone];
  }

  static isCreature(tone: SkinToneName): tone is CreatureToneName {
    return CREATURES.has(tone);
  }
}
