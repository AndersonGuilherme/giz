import type { FC } from 'react';
import { Species } from '../../../../domain/character/species/Species.ts';
import { shade, useSvgId } from '../../svg.ts';
import { Garment } from '../outfits/Garment.tsx';
import { SHIRT } from '../outfits/shapes.ts';
import { ARM } from '../measures.ts';
import { skinOf } from '../parameters.ts';
import type { HandOverlayProps, OverlayProps, SpeciesOverlay } from './SpeciesOverlay.ts';

// The torso wraps come from the domain (as on the arms and legs), clipped to the shirt shape.
const TORSO = { top: 300, height: 152 } as const;

const Wrapped: FC<OverlayProps> = ({ look }) => {
  const clip = useSvgId('mummy-torso');
  const wraps = Species.wraps(look.species, TORSO.height);
  const path = wraps.map(({ at, slant }) => `M100,${TORSO.top + at + slant * 6} L300,${TORSO.top + at - slant * 6}`).join(' ');
  return (
    <g>
      <Garment path={SHIRT} color={skinOf(look).base} look={look} part="wraps" />
      <clipPath id={clip}><path d={SHIRT} /></clipPath>
      <path d={path} clipPath={`url(#${clip})`} fill="none" stroke={skinOf(look).shade} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

const HandWraps: FC<HandOverlayProps> = ({ look }) => (
  <path d={`M-18,${ARM.fore + 2} L18,${ARM.fore - 4} M-19,${ARM.fore + 14} L19,${ARM.fore + 8}`} stroke={shade(skinOf(look).base, -0.2)} strokeWidth={3} strokeLinecap="round" />
);

/** The mummy: bandage strips on the head, the torso wrapped (arms and legs get the domain's wraps too), wraps across the hands. */
export const mummy: SpeciesOverlay = {
  paints: (look) => ({ bandage: { fill: shade(skinOf(look).base, 0.12), width: 3.5 } }),
  Body: Wrapped,
  Hand: HandWraps,
};
