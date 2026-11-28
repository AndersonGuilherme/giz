import type { FC } from 'react';
import { ChalkStroke } from '../../../domain/drawing/ChalkStroke.ts';
import type { Silhouette } from '../../../domain/drawing/Silhouette.ts';
import { ChalkLine } from '../../drawing/ChalkLine.tsx';
import { CHALK_WIDTH } from './measures.ts';
import type { Look } from './parameters.ts';

type ChalkedProps = Readonly<{ look: Look; outline: Silhouette; part: string; side?: -1 | 1; width?: number }>;

/** The chalk outline of one part (and side) of this character, unless the look turns the chalk off. */
export const Chalked: FC<ChalkedProps> = ({ look, outline, part, side, width = CHALK_WIDTH }) =>
  (look.chalk ? <ChalkLine outline={outline} seed={ChalkStroke.seed(look.id, part, side)} width={width} /> : null);
