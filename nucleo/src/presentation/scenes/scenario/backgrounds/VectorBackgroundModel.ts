import type { FC } from 'react';
import type { Backdrop } from '../../../../domain/scenario/BackdropLayout.ts';

/** Named colors of a vector background; the scene's `background.colors` override them one by one. */
export type Palette = Readonly<Record<string, string>>;

/**
 * What every layer draws with, in video pixels: `ground` is the floor line where the characters' feet rest and
 * `unit` is 1/1000 of the shorter side, so objects keep their size next to the characters in 9:16 and in 16:9.
 * `backdrop` is the rest of the plan (horizon, the characters' stage, the corners for front props).
 */
export type LayerProps = Readonly<{ colors: Palette; width: number; height: number; ground: number; unit: number; backdrop: Backdrop }>;

/** Back, middle and front layers (parallax 0.3, 0.6 and 1.0); the front one is drawn over the characters. */
export type VectorBackgroundModel = Readonly<{ palette: Palette; layers: readonly [FC<LayerProps>, FC<LayerProps>, FC<LayerProps>] }>;
