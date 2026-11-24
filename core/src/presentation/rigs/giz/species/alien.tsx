import { shade } from '../../svg.ts';
import { skinOf } from '../parameters.ts';
import type { SpeciesOverlay } from './SpeciesOverlay.ts';

/** The alien: antennae in a darker skin color, their tips glowing in the outfit accent. */
export const alien: SpeciesOverlay = {
  paints: (look) => ({
    stalk: { fill: shade(skinOf(look).base, -0.2), width: 3.5 },
    light: { fill: '#f6d35b', width: 3.5 },
  }),
};
