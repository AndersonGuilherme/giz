export const SKIN_TONES = ['light', 'fair', 'medium', 'tan', 'brown', 'deep'] as const;
export type SkinToneName = (typeof SKIN_TONES)[number];

/** `base` fills the skin, `shade` the side away from the light, `line` the closed mouth, nose and eye rims, `blush` the cheeks. */
export type SkinColors = Readonly<{ base: string; shade: string; line: string; blush: string }>;

// The giz palette, light to deep. Every line color keeps a clear contrast with its base, and no tone is black.
const TONES: Readonly<Record<SkinToneName, SkinColors>> = {
  light: { base: '#f8dcc8', shade: '#ebc2a8', line: '#7a3f33', blush: '#f2a08f' },
  fair: { base: '#efc19c', shade: '#dea47f', line: '#6e3626', blush: '#ec8d74' },
  medium: { base: '#d89b6c', shade: '#c18053', line: '#5a2b1c', blush: '#e07a5c' },
  tan: { base: '#b87b4f', shade: '#9f643c', line: '#45200f', blush: '#d0694b' },
  brown: { base: '#916041', shade: '#7a4c30', line: '#2e140a', blush: '#c25e45' },
  deep: { base: '#714a33', shade: '#5e3b27', line: '#1c0c05', blush: '#a9503c' },
};

/** The giz skin palette: the default characters have a skin tone, from light to deep. */
export class SkinTone {
  static readonly DEFAULT: SkinToneName = 'medium';

  static colors(tone: SkinToneName): SkinColors {
    return TONES[tone];
  }
}
