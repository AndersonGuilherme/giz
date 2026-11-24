import type { FC } from 'react';
import { shade, useSvgId } from '../../svg.ts';
import { Garment } from '../outfits/Garment.tsx';
import { SHIRT } from '../outfits/shapes.ts';
import { ARM, FEET } from '../measures.ts';
import { skinOf } from '../parameters.ts';
import type { HandOverlayProps, OverlayProps, SpeciesOverlay } from './SpeciesOverlay.ts';

// Slanted wraps every few units down the torso and the legs, clipped to the body.
const wraps = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) }, (_empty, index) => from + index * step)
    .map((y, index) => `M100,${y + (index % 2 === 0 ? 6 : -6)} L300,${y + (index % 2 === 0 ? -6 : 6)}`).join(' ');
const LEGS = `M160,440 L194,440 L194,${FEET.y} L160,${FEET.y} Z M206,440 L240,440 L240,${FEET.y} L206,${FEET.y} Z`;
const WRAPS = { torso: wraps(318, 452, 20), legs: wraps(462, FEET.y, 18) } as const;

const Wrapped: FC<OverlayProps> = ({ look }) => {
  const [torso, legs] = [useSvgId('mummy-torso'), useSvgId('mummy-legs')];
  const line = skinOf(look).shade;
  return (
    <g fill="none" stroke={line} strokeWidth={4} strokeLinecap="round">
      <Garment path={SHIRT} color={skinOf(look).base} look={look} part="wraps" />
      <clipPath id={torso}><path d={SHIRT} /></clipPath>
      <clipPath id={legs}><path d={LEGS} /></clipPath>
      <path d={WRAPS.torso} clipPath={`url(#${torso})`} />
      <path d={WRAPS.legs} clipPath={`url(#${legs})`} />
    </g>
  );
};

const HandWraps: FC<HandOverlayProps> = ({ look }) => (
  <path d={`M-18,${ARM.fore + 2} L18,${ARM.fore - 4} M-19,${ARM.fore + 14} L19,${ARM.fore + 8}`} stroke={shade(skinOf(look).base, -0.2)} strokeWidth={3} strokeLinecap="round" />
);

/** The mummy: bandage strips on the head, the body and legs wrapped, wraps across the hands. */
export const mummy: SpeciesOverlay = {
  paints: (look) => ({ bandage: { fill: shade(skinOf(look).base, 0.12), width: 3.5 } }),
  Body: Wrapped,
  Hand: HandWraps,
};
