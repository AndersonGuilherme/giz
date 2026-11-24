import type { FC } from 'react';
import { Garment } from '../outfits/Garment.tsx';
import { skinOf } from '../parameters.ts';
import type { OverlayProps, SpeciesOverlay } from './SpeciesOverlay.ts';

// A soft sheet body from the shoulders, wider at the bottom, ending in a wavy hem (no legs).
const SHEET = 'M126,300 C150,286 250,286 274,300 C292,380 302,460 308,532 Q290,560 272,540 Q254,566 236,544'
  + ' Q218,568 200,546 Q182,568 164,544 Q146,566 128,540 Q110,560 92,532 C98,460 108,380 126,300 Z';

const Sheet: FC<OverlayProps> = ({ look }) => <Garment path={SHEET} color={skinOf(look).base} look={look} part="sheet" />;

/** The ghost: a curl of mist on the head and a sheet body with a wavy hem; a cool, cute mouth. */
export const ghost: SpeciesOverlay = {
  paints: (look) => ({ wisp: { fill: skinOf(look).base, width: 4 } }),
  Body: Sheet,
  mouth: { inside: '#3c4868', lips: '#8fa4c8', tongue: '#f1a7bd' },
};
