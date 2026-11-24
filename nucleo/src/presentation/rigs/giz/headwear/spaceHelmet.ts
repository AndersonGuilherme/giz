import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A glass bubble tinted by the accent, on a collar in the main color. */
export const spaceHelmet: HeadwearStyle = (palette) => ({
  ...basePaints(palette),
  band: { fill: palette.main },
  glass: { fill: palette.accent, opacity: 0.2 },
  'glass-back': { fill: palette.accent, opacity: 0.14, chalk: false },
});
