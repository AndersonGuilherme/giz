import type { FC } from 'react';
import type { Brow } from '../../../domain/character/FaceGeometry.ts';
import { EYES, HEAD, UNIT } from './measures.ts';
import { skinOf, type Look } from './parameters.ts';

type Pair = Readonly<{ left: Brow; right: Brow }>;

// Thick in the middle, thin at the tips; drawn for the left brow, mirrored for the right (inner end at +x).
// A skin-colored outline keeps the brow readable over a hat or a fringe.
const SHAPE = 'M-30,8 C-22,-6 12,-11 30,-1 C16,-3 -16,-1 -30,8 Z';

const OneBrow: FC<Readonly<{ brow: Brow; side: -1 | 1; look: Look }>> = ({ brow, side, look }) => {
  const x = HEAD.x + side * (EYES.spacing + 2);
  const y = EYES.y - (EYES.height / 2) * look.eyeScale - 12 + brow.height * UNIT;
  const outline = skinOf(look).base;
  const transform = `translate(${x} ${y}) rotate(${-side * brow.innerAngle}) scale(${-side} 1)`;
  return (
    <g transform={transform} strokeLinejoin="round">
      <path d={SHAPE} fill={outline} stroke={outline} strokeWidth={15} />
      <path d={SHAPE} fill={look.hairColor} stroke={look.hairColor} strokeWidth={8} />
    </g>
  );
};

export const Brows: FC<Readonly<{ pair: Pair; look: Look }>> = ({ pair, look }) => (
  <g>
    <OneBrow brow={pair.left} side={-1} look={look} />
    <OneBrow brow={pair.right} side={1} look={look} />
  </g>
);
