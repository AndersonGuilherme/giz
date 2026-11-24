import { Garment, type Clothes } from '../Garment.tsx';
import { BODICE, skirt } from '../shapes.ts';

// A bodice and a long skirt, a sash at the waist and three buttons on the skirt.
export const dress: Clothes = {
  hem: 540,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={skirt(396, 546, 40)} color={palette.main} look={look} part="skirt" />
      <Garment path={BODICE} color={palette.main} look={look} part="bodice" />
      <path d="M128,400 Q200,412 272,400" fill="none" stroke={palette.accent} strokeWidth={10} strokeLinecap="round" />
      {[160, 200, 240].map((x) => <circle key={x} cx={x} cy={470 + (x === 200 ? 18 : 0)} r={9} fill={palette.accent} />)}
    </g>
  ),
};
