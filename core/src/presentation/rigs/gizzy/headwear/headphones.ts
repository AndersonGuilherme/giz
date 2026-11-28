import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A dark band and cups, with cushions in the accent color. */
export const headphones: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: palette.accent, width: 4 } });
