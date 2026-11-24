import type { FC } from 'react';
import type { Brow } from '../../../domain/character/FaceGeometry.ts';
import { EYES, HEAD, UNIT } from './measures.ts';
import type { Look } from './parameters.ts';
import { contrast } from './svg.ts';

type Pair = Readonly<{ left: Brow; right: Brow }>;

// Thick in the middle, thin at the tips; drawn for the left brow, mirrored for the right (inner end at +x).
// A head-colored outline keeps the brow readable over a light scarf or hat.
const SHAPE = 'M-34,8 C-26,-8 12,-13 34,-1 C18,-3 -18,-1 -34,8 Z';

const OneBrow: FC<Readonly<{ brow: Brow; side: -1 | 1; look: Look }>> = ({ brow, side, look }) => {
  const x = HEAD.x + side * (EYES.spacing + 2);
  const y = EYES.y - EYES.radiusY * look.eyeScale - 11 + brow.height * UNIT;
  const color = contrast(look.headColor);
  const transform = `translate(${x} ${y}) rotate(${-side * brow.innerAngle}) scale(${-side} 1)`;
  return (
    <g transform={transform} strokeLinejoin="round">
      <path d={SHAPE} fill={look.headColor} stroke={look.headColor} strokeWidth={17} />
      <path d={SHAPE} fill={color} stroke={color} strokeWidth={9} />
    </g>
  );
};

export const Brows: FC<Readonly<{ pair: Pair; look: Look }>> = ({ pair, look }) => (
  <g>
    <OneBrow brow={pair.left} side={-1} look={look} />
    <OneBrow brow={pair.right} side={1} look={look} />
  </g>
);
