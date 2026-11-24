import type { VectorBackground } from './BackgroundSource.ts';
import { EVERYDAY_PALETTES } from './palettes/everydayPalettes.ts';
import { PAST_PALETTES } from './palettes/pastPalettes.ts';
import { PRESENT_AND_FUTURE_PALETTES } from './palettes/presentAndFuturePalettes.ts';
import { SPOOKY_PALETTES } from './palettes/spookyPalettes.ts';

/** Named colors of a vector background. */
export type Palette = Readonly<Record<string, string>>;

// Every vector background has its palette (`satisfies`), and each palette keeps its own literal keys.
const PALETTES = {
  ...EVERYDAY_PALETTES, ...PAST_PALETTES, ...PRESENT_AND_FUTURE_PALETTES, ...SPOOKY_PALETTES,
} as const satisfies Readonly<Record<VectorBackground, Palette>>;

/** The color names of one background: a view that reads another name does not compile. */
export type PaletteKey<B extends VectorBackground> = keyof (typeof PALETTES)[B] & string;

/** The colors a background's layers draw with: exactly its palette's names. */
export type BackgroundColors<B extends VectorBackground> = Readonly<Record<PaletteKey<B>, string>>;

/** The palettes of the vector backgrounds as data: a scene's `background.colors` may override only these keys. */
export class BackgroundPalette {
  static defaults<B extends VectorBackground>(background: B): BackgroundColors<B> {
    return PALETTES[background] as BackgroundColors<B>;
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
  static with<B extends VectorBackground>(background: B, overrides: Palette): BackgroundColors<B> {
    return { ...PALETTES[background], ...overrides } as BackgroundColors<B>;
  }
}
