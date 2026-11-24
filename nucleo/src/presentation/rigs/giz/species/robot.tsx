import { shade } from '../../svg.ts';
import { skinOf } from '../parameters.ts';
import type { SpeciesOverlay } from './SpeciesOverlay.ts';

/** The robot: a darker antenna with a light in the eye color, side bolts, a forehead seam and rivets; a screen mouth. */
export const robot: SpeciesOverlay = {
  paints: (look) => {
    const skin = skinOf(look);
    return {
      metal: { fill: shade(skin.base, -0.25), width: 4 },
      light: { fill: look.eyeColor, width: 3.5 },
      bolt: { fill: shade(skin.base, -0.18), width: 4.5 },
      seam: { fill: skin.line, opacity: 0.4, chalk: false },
      rivet: { fill: skin.line, opacity: 0.5, chalk: false },
    };
  },
  mouth: { inside: '#17222b', lips: '#7f8e99', teeth: '#a8f3ff', tongue: '#3fa7c0' },
};
