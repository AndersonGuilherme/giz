import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A tweed cap: the body in the main color, the bill in the darker accent. */
export const flatCap: HeadwearStyle = (palette) => ({ ...basePaints(palette), brim: { fill: palette.accent } });
