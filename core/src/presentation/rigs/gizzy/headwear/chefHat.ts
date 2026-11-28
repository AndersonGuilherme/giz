import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A white puffed hat over a pale band. */
export const chefHat: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: palette.accent } });
