import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A headscarf with its knot in the deeper accent. */
export const scarf: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: palette.accent } });
