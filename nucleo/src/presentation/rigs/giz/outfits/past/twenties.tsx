import { shade } from '../../../svg.ts';
import { skinOf } from '../../parameters.ts';
import { Garment, type Clothes } from '../Garment.tsx';
import { SHIRT } from '../shapes.ts';

// A straight sleeveless dress to the knee with rows of fringe, thin straps and a long bead necklace.
const DRESS = 'M136,322 C160,312 240,312 264,322 L278,500 C240,512 160,512 122,500 Z';
const FRINGES = [430, 466, 500];

export const twenties: Clothes = {
  hem: 506,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color={skinOf(look).base} look={look} part="chest" />
      <Garment path={DRESS} color={palette.main} look={look} part="dress" />
      <path d="M150,318 L160,296 M250,318 L240,296" stroke={palette.main} strokeWidth={7} strokeLinecap="round" />
      {FRINGES.map((y) => (
        <path key={y} d={`M${124 + (y - 430) / 7},${y} Q200,${y + 12} ${276 - (y - 430) / 7},${y}`} fill="none" stroke={palette.accent} strokeWidth={6} strokeDasharray="3 6" />
      ))}
      <path d="M176,300 Q200,420 224,300" fill="none" stroke={shade(palette.main, 0.6)} strokeWidth={5} strokeDasharray="1 7" strokeLinecap="round" />
    </g>
  ),
};
