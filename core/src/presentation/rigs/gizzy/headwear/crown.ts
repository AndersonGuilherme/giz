import { shade } from '../../svg.ts';
import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** Gold points on a deeper gold band, with gems in the accent color. */
export const crown: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: shade(palette.main, -0.18) } });
