import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** Green leaves, every other one in the darker accent green. */
export const laurel: HeadwearStyle = (palette) => ({ ...basePaints(palette), 'leaf-dark': { fill: palette.accent, width: 3.5 } });
