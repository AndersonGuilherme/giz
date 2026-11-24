import type { FC } from 'react';
import type { Backdrop } from '../../../../domain/scenario/BackdropLayout.ts';
import type { BackgroundColors, Palette } from '../../../../domain/scenario/BackgroundPalette.ts';
import type { VectorBackground } from '../../../../domain/scenario/BackgroundSource.ts';

/** Named colors of a vector background (`BackgroundPalette` in the domain); the scene's `background.colors` override them one by one. */
export type { Palette };

/** The colors of one background, typed by its palette's names: reading a name the palette lacks does not compile. */
export type ColorsOf<B extends VectorBackground> = BackgroundColors<B>;

/**
 * What every layer draws with, in video pixels: `ground` is the floor line where the characters' feet rest and
 * `unit` is 1/1000 of the shorter side, so objects keep their size next to the characters in 9:16 and in 16:9.
 * `backdrop` is the rest of the plan (horizon, the characters' stage, the corners for front props). `C` is the
 * background's own colors; shared parts take any palette.
 */
export type LayerProps<C extends Palette = Palette> = Readonly<{ colors: C; width: number; height: number; ground: number; unit: number; backdrop: Backdrop }>;

/** Back, middle and front layers (parallax 0.3, 0.6 and 1.0); the front one is drawn over the characters. */
export type VectorBackgroundModel<C extends Palette = Palette> = Readonly<{ layers: readonly [FC<LayerProps<C>>, FC<LayerProps<C>>, FC<LayerProps<C>>] }>;
