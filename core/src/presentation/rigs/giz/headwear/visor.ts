import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A glowing see-through band over the eyes, with dark side pieces and strap. */
export const visor: HeadwearStyle = (palette) => ({
  ...basePaints(palette),
  glass: { fill: palette.accent, opacity: 0.34 },
  band: { fill: palette.main },
});
