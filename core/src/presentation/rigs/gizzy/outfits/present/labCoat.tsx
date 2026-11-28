import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { coatHalves, SHIRT } from '../shapes.ts';

// A long white coat, open over a shirt in the accent color, with pockets and a pen.
const [LEFT, RIGHT] = coatHalves(540, 26);

export const labCoat: Clothes = {
  hem: 540,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color={palette.accent} look={look} part="shirt" />
      <Garment path={LEFT} color={palette.main} look={look} part="coat-left" />
      <Garment path={RIGHT} color={palette.main} look={look} part="coat-right" />
      <Patch path="M226,350 L256,350 L258,378 L228,378 Z" color={shade(palette.main, -0.08)} look={look} part="pocket" width={3} />
      <rect x={234} y={336} width={6} height={22} rx={2} fill="#3b6bc4" />
      <Patch path="M132,450 L172,450 L174,486 L134,486 Z" color={shade(palette.main, -0.08)} look={look} part="pocket-low" width={3} />
    </g>
  ),
};
