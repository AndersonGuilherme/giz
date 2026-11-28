import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { torso } from '../shapes.ts';

// A long flowing tunic with a geometric collar and a diagonal sash in the accent color.
const COLLAR = 'M160,292 L180,284 L220,284 L240,292 L226,318 L200,326 L174,318 Z';
const SASH = 'M140,312 L162,304 L276,500 L254,508 Z';

export const utopian: Clothes = {
  hem: 548,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={torso(548, 30)} color={palette.main} look={look} part="tunic" />
      <path d="M150,470 Q200,486 250,470" fill="none" stroke={shade(palette.main, -0.12)} strokeWidth={4} />
      <Patch path={SASH} color={palette.accent} look={look} part="sash" width={3.5} />
      <Patch path={COLLAR} color={shade(palette.accent, -0.2)} look={look} part="collar" width={3.5} />
    </g>
  ),
};
