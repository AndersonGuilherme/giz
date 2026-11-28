import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A soft felt beret with a darker stem. */
export const beret: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: palette.accent, width: 3.5 } });
