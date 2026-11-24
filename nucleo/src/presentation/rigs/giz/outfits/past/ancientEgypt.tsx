import { shade } from '../../../svg.ts';
import { skinOf } from '../../parameters.ts';
import { Garment, type Clothes } from '../Garment.tsx';
import { SHIRT, skirt } from '../shapes.ts';

// A long linen robe under a broad collar of gold bands, a gold belt at the waist.
const COLLAR = ['M146,304 Q200,350 254,304', 'M140,312 Q200,372 260,312', 'M136,322 Q200,392 264,322'];

export const ancientEgypt: Clothes = {
  hem: 546,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color={skinOf(look).base} look={look} part="chest" />
      <Garment path={skirt(350, 546, 26)} color={palette.main} look={look} part="robe" />
      <path d="M134,352 L266,352" stroke={palette.main} strokeWidth={10} />
      {COLLAR.map((path, index) => (
        <path key={path} d={path} fill="none" stroke={index === 1 ? shade(palette.accent, -0.25) : palette.accent} strokeWidth={10} strokeLinecap="round" />
      ))}
      <rect x={136} y={408} width={128} height={14} rx={6} fill={palette.accent} />
      <path d="M192,422 L208,422 L214,500 L186,500 Z" fill={shade(palette.main, -0.1)} />
    </g>
  ),
};
