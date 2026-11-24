import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { LONG_TOP } from '../shapes.ts';

// A dark jacket with a high collar, an off-center zip and glowing circuit lines in the accent color.
const COLLAR = 'M156,300 L170,276 L230,276 L244,300 L226,306 L200,296 L174,306 Z';
const CIRCUITS = 'M150,350 L176,350 L186,366 M150,400 L170,400 L180,384 M250,350 L230,350 M248,416 L228,416 L220,430';

export const cyber: Clothes = {
  hem: 470,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={LONG_TOP} color={palette.main} look={look} part="jacket" />
      <path d="M212,300 L206,470" stroke={palette.accent} strokeWidth={4} />
      <path d={CIRCUITS} fill="none" stroke={palette.accent} strokeWidth={4} strokeLinecap="round" />
      {[[186, 366], [180, 384], [220, 430]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r={4} fill={palette.accent} />)}
      <Patch path={COLLAR} color={shade(palette.main, 0.12)} look={look} part="collar" width={3.5} />
    </g>
  ),
};
