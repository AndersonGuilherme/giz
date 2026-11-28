import { shade } from '../../../svg.ts';
import { skinOf } from '../../parameters.ts';
import { Garment, type Clothes } from '../Garment.tsx';
import { SHIRT } from '../shapes.ts';

// A one-shoulder pelt with a jagged hem over the bare chest; dark spots on the fur.
const PELT = 'M156,296 C196,288 250,290 274,302 L292,466 L274,480 L256,466 L238,484 L218,468 L198,486 L178,468 L158,484 L140,466 L118,476 L126,392 C132,352 146,322 156,296 Z';
const SPOTS = [[228, 340, 12, 8], [182, 392, 10, 7], [246, 420, 9, 6], [160, 440, 8, 6], [210, 452, 11, 6]] as const;

export const caveman: Clothes = {
  hem: 470,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color={skinOf(look).base} look={look} part="chest" />
      <Garment path={PELT} color={palette.main} look={look} part="pelt" />
      {SPOTS.map(([cx, cy, rx, ry]) => <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} fill={palette.accent} opacity={0.8} />)}
      <path d="M128,430 Q200,446 284,426" fill="none" stroke={shade(palette.main, -0.35)} strokeWidth={7} strokeLinecap="round" />
    </g>
  ),
};
