import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A dark three-cornered hat with a gold trim. */
export const pirateHat: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: palette.accent } });
