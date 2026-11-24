import { shade } from '../../svg.ts';
import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';

/** A cap with a darker bill and a button in the accent color. */
export const cap: HeadwearStyle = (palette) => ({
  ...basePaints(palette),
  brim: { fill: shade(palette.main, -0.22) },
  band: { fill: palette.accent, width: 3.5 },
});
