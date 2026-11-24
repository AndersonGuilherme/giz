import { skinOf } from '../../parameters.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { SHIRT } from '../shapes.ts';

// A white drape from the left shoulder across the body to the ankles; a colored border along its edge.
const DRAPE = 'M126,300 C150,286 186,286 214,292 L280,440 L296,540 C240,554 160,554 104,540 L116,420 Z';
const FOLD = 'M150,300 C176,360 214,410 270,452 L266,466 C206,424 166,376 142,312 Z';

export const toga: Clothes = {
  hem: 540,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color={skinOf(look).base} look={look} part="chest" />
      <Garment path={DRAPE} color={palette.main} look={look} part="drape" />
      <Patch path={FOLD} color={palette.accent} look={look} part="border" />
      <path d="M140,470 Q200,486 262,468 M150,510 Q200,522 250,508" fill="none" stroke="#000000" strokeOpacity={0.12} strokeWidth={4} />
    </g>
  ),
};
