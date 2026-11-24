import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { TUNIC } from '../shapes.ts';

// A wool tunic with a fur mantle on the shoulders, a leather belt and a woven hem band.
const MANTLE = 'M112,312 C120,282 280,282 288,312 L282,334 L264,326 L248,340 L230,328 L212,342 L194,328 L176,342 L158,328 L140,340 L122,328 Z';

export const viking: Clothes = {
  hem: 500,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={TUNIC} color={palette.main} look={look} part="tunic" />
      <path d="M108,486 Q200,502 292,486" fill="none" stroke={palette.accent} strokeWidth={10} />
      <Patch path={MANTLE} color={palette.accent} look={look} part="mantle" />
      <rect x={114} y={414} width={172} height={18} rx={6} fill={shade(palette.accent, -0.45)} />
      <circle cx={200} cy={423} r={12} fill="#c9ced3" stroke={shade(palette.accent, -0.5)} strokeWidth={3} />
    </g>
  ),
};
