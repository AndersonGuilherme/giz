import { shade } from '../../svg.ts';
import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A safety helmet with a light ridge and a darker brim. */
export const hardHat: HeadwearStyle = (palette) => ({ ...basePaints(palette), band: { fill: shade(palette.main, -0.18) } });
