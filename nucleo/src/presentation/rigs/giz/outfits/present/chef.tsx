import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { LONG_TOP } from '../shapes.ts';

// A double-breasted white jacket with two rows of buttons and a neckerchief in the accent color.
const KERCHIEF = 'M164,290 C180,302 220,302 236,290 L226,312 L200,322 L174,312 Z';

export const chef: Clothes = {
  hem: 470,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={LONG_TOP} color={palette.main} look={look} part="jacket" />
      <path d="M232,312 C224,360 222,420 226,470" fill="none" stroke={shade(palette.main, -0.18)} strokeWidth={4} />
      {[344, 384, 424].flatMap((y) => [180, 220].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r={6} fill={shade(palette.main, -0.3)} />))}
      <Patch path={KERCHIEF} color={palette.accent} look={look} part="kerchief" width={3.5} />
    </g>
  ),
};
