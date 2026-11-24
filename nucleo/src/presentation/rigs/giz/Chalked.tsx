import type { FC } from 'react';
import type { Silhouette } from '../../../domain/drawing/Silhouette.ts';
import { ChalkLine } from '../../drawing/ChalkLine.tsx';
import { CHALK_WIDTH } from './measures.ts';
import type { Look } from './parameters.ts';

/** The chalk outline of one part of the character, unless the look turns the chalk off. */
export const Chalked: FC<Readonly<{ look: Look; outline: Silhouette; seed: string; width?: number }>> = ({ look, outline, seed, width = CHALK_WIDTH }) =>
  (look.chalk ? <ChalkLine outline={outline} seed={seed} width={width} /> : null);
