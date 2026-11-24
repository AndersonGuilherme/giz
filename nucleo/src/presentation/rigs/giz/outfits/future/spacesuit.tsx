import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { LONG_TOP } from '../shapes.ts';

// A padded white suit with a chest control panel, a belt and accent stripes on the shoulders.
const PANEL = 'M170,346 L230,346 L232,396 L168,396 Z';

export const spacesuit: Clothes = {
  hem: 470,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={LONG_TOP} color={palette.main} look={look} part="suit" />
      <path d="M134,312 L160,304 M266,312 L240,304" stroke={palette.accent} strokeWidth={9} strokeLinecap="round" />
      <Patch path={PANEL} color={shade(palette.main, -0.35)} look={look} part="panel" width={3} />
      {[184, 200, 216].map((x, index) => <circle key={x} cx={x} cy={372} r={5} fill={index === 1 ? '#7fd36b' : palette.accent} />)}
      <rect x={124} y={428} width={152} height={16} rx={6} fill={shade(palette.main, -0.25)} />
    </g>
  ),
};
