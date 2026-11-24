import type { HeadwearPalette } from '../../../../domain/character/headwear/HeadwearDesign.ts';
import { shade } from '../../svg.ts';
import type { Paint } from '../HeadParts.tsx';

/** How a piece paints each of its roles (main, band, brim, gem, leaf, accent, glass…). */
export type HeadwearStyle = (palette: HeadwearPalette) => Readonly<Record<string, Paint>>;

const GLASS = '#c8ecff';

/** The paints most pieces share: the body in the main color, a darker band and brim, the accent for trims. */
export const basePaints = ({ main, accent }: HeadwearPalette): Readonly<Record<string, Paint>> => ({
  main: { fill: main },
  band: { fill: shade(main, -0.3) },
  brim: { fill: shade(main, -0.12) },
  accent: { fill: accent },
  gem: { fill: accent, width: 3.5 },
  leaf: { fill: main, width: 3.5 },
  glass: { fill: GLASS, opacity: 0.26 },
  'glass-back': { fill: GLASS, opacity: 0.14, chalk: false },
});
