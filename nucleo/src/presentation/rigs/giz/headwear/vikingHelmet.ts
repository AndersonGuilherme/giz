import { shade } from '../../svg.ts';
import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A metal dome with a riveted band and nose ridge, and two pale horns. */
export const vikingHelmet: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: shade(palette.main, -0.28) } });
