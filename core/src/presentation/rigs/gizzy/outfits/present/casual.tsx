import { shade } from '../../../svg.ts';
import { Garment, type Clothes } from '../Garment.tsx';
import { SHIRT } from '../shapes.ts';

// A t-shirt with a round neck and a small round print on the chest, over jeans (it was `tshirt` before).
export const casual: Clothes = {
  hem: 446,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color={palette.main} look={look} part="shirt" />
      <path d="M168,296 Q200,318 232,296" fill="none" stroke={shade(palette.main, -0.3)} strokeWidth={5} />
      <circle cx={232} cy={350} r={14} fill={palette.accent} />
      <path d="M140,446 L260,446" stroke={shade(palette.legs, -0.3)} strokeWidth={6} />
    </g>
  ),
};
