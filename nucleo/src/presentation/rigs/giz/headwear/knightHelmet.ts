import { shade } from '../../svg.ts';
import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** Polished steel with a darker rim, and a plume in the accent color. */
export const knightHelmet: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: shade(palette.main, -0.35) } });
