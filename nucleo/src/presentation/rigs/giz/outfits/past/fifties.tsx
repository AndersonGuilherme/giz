import { shade } from '../../../svg.ts';
import { Garment, type Clothes } from '../Garment.tsx';
import { BODICE, skirt } from '../shapes.ts';

// A white blouse with a round collar over a full swing skirt with polka dots and a belt.
const DOTS = [[150, 450], [196, 470], [244, 452], [126, 500], [172, 506], [222, 510], [270, 498], [200, 430]] as const;

export const fifties: Clothes = {
  hem: 520,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={skirt(396, 516, 56)} color={palette.main} look={look} part="skirt" />
      {DOTS.map(([cx, cy]) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={7} fill={palette.accent} />)}
      <Garment path={BODICE} color={palette.secondary} look={look} part="blouse" />
      <path d="M170,294 Q186,314 200,300 Q214,314 230,294" fill="none" stroke={shade(palette.secondary, -0.25)} strokeWidth={5} />
      <rect x={130} y={392} width={140} height={16} rx={7} fill={shade(palette.main, -0.35)} />
    </g>
  ),
};
