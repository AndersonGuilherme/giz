import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A wide-brimmed hat with a ribbon in the accent color. */
export const hat: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: palette.accent } });
