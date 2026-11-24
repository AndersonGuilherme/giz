import type { VectorBackground } from './BackgroundSource.ts';
import { EVERYDAY_PALETTES } from './palettes/everydayPalettes.ts';
import { PAST_PALETTES } from './palettes/pastPalettes.ts';
import { PRESENT_AND_FUTURE_PALETTES } from './palettes/presentAndFuturePalettes.ts';
import { SPOOKY_PALETTES } from './palettes/spookyPalettes.ts';

/** Named colors of a vector background. */
export type Palette = Readonly<Record<string, string>>;

// The record type makes every vector background have its palette.
const PALETTES: Readonly<Record<VectorBackground, Palette>> = {
  ...EVERYDAY_PALETTES, ...PAST_PALETTES, ...PRESENT_AND_FUTURE_PALETTES, ...SPOOKY_PALETTES,
};

/** The palettes of the vector backgrounds as data: a scene's `background.colors` may override only these keys. */
export class BackgroundPalette {
  static defaults(background: VectorBackground): Palette {
    return PALETTES[background];
  }

  static keys(background: VectorBackground): string[] {
    return Object.keys(PALETTES[background]);
  }

  /** The override keys the background does not have (a typo would otherwise do nothing), in the order given. */
  static unknownKeys(background: VectorBackground, overrides: Palette): string[] {
    const known = new Set(BackgroundPalette.keys(background));
    return Object.keys(overrides).filter((key) => !known.has(key));
  }

  /** The defaults with the overrides on top. */
  static with(background: VectorBackground, overrides: Palette): Palette {
    return { ...PALETTES[background], ...overrides };
  }
}
