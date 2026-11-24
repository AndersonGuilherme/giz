import { shade } from '../../../svg.ts';
import { Garment, type Clothes } from '../Garment.tsx';
import { TUNIC } from '../shapes.ts';

// A plain long tunic with a flat belt and a square buckle (it was `tunic` before the era wardrobe).
export const commoner: Clothes = {
  hem: 500,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={TUNIC} color={palette.main} look={look} part="tunic" />
      <path d="M170,296 L200,330 L230,296" fill="none" stroke={shade(palette.main, -0.3)} strokeWidth={5} />
      <path d="M114,404 Q200,418 286,404 L288,422 Q200,436 112,422 Z" fill={palette.accent} />
      <rect x={186} y={406} width={28} height={24} rx={4} fill="none" stroke={shade(palette.accent, 0.4)} strokeWidth={5} />
    </g>
  ),
};
