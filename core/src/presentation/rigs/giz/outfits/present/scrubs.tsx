import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { SHIRT, V_NECK } from '../shapes.ts';

// A V-neck top with a chest pocket and a name badge in the accent color, trousers of the same color.
export const scrubs: Clothes = {
  hem: 452,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color={palette.main} look={look} part="top" />
      <path d={V_NECK} fill={shade(palette.main, -0.3)} />
      <Patch path="M146,356 L180,356 L182,388 L148,388 Z" color={shade(palette.main, 0.12)} look={look} part="pocket" width={3} />
      <rect x={222} y={350} width={34} height={14} rx={4} fill={palette.accent} />
    </g>
  ),
};
