import { shade } from '../../svg.ts';
import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A pointed hat with a darker brim and a buckle-colored band. */
export const witchHat: HeadwearStyle = (palette) => ({
  ...basePaints(palette),
  brim: { fill: shade(palette.main, -0.2) },
  band: { fill: palette.accent },
});
