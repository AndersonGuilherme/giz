import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { LONG_TOP } from '../shapes.ts';

// Metal plates: a chest plate around a glowing core, segmented belly plates and shoulder bolts.
const CHEST = 'M146,312 C170,302 230,302 254,312 L246,384 C226,394 174,394 154,384 Z';

export const robotArmor: Clothes = {
  hem: 466,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={LONG_TOP} color={palette.main} look={look} part="armor" />
      <Patch path={CHEST} color={shade(palette.main, 0.18)} look={look} part="chest" width={3.5} />
      <circle cx={200} cy={348} r={18} fill={shade(palette.accent, -0.4)} />
      <circle cx={200} cy={348} r={11} fill={palette.accent} />
      {[408, 428, 448].map((y) => <rect key={y} x={156} y={y} width={88} height={14} rx={5} fill={shade(palette.main, -0.2)} />)}
      {[138, 262].map((x) => <circle key={x} cx={x} cy={312} r={5} fill={shade(palette.main, -0.4)} />)}
    </g>
  ),
};
