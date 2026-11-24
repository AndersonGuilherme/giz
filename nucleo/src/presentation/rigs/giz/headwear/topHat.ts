import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A tall dark hat with a colored ribbon. */
export const topHat: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: palette.accent } });
