import type { FC } from 'react';
import { ChalkStroke } from '../../domain/drawing/ChalkStroke.ts';
import type { Silhouette } from '../../domain/drawing/Silhouette.ts';

/** The off-white of the Gizzy chalk. */
export const CHALK = '#f3efe2';

// Proportions of the stroke width: how far the line wobbles and how often it bends.
const WOBBLE = 0.42;
const SECOND_WOBBLE = 0.7;
const SPACING = 2.6;

type ChalkLineProps = Readonly<{ outline: Silhouette; seed: string; width: number; color?: string }>;

/**
 * The Gizzy signature: a chalk line around a shape, drawn twice from the domain wobble (a firm stroke and a thin,
 * fainter second pass), so it reads hand-drawn but stays the same in every frame.
 */
export const ChalkLine: FC<ChalkLineProps> = ({ outline, seed, width, color = CHALK }) => {
  const main = ChalkStroke.for(seed, width * WOBBLE).trace(outline, width * SPACING);
  const second = ChalkStroke.for(`${seed}/2`, width * SECOND_WOBBLE).trace(outline, width * SPACING);
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d={main.path()} strokeWidth={width} opacity={0.94} />
      <path d={second.path()} strokeWidth={width * 0.34} opacity={0.5} />
    </g>
  );
};
