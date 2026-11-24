import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { LONG_TOP } from '../shapes.ts';

// A doublet with gold braid down the front, a short flared skirt and a pleated ruff at the neck.
const PEPLUM = 'M118,446 L282,446 L298,486 C240,500 160,500 102,486 Z';
const RUFF = 'M140,298 Q150,282 164,296 Q176,280 188,294 Q200,278 212,294 Q224,280 236,296 Q250,282 260,298 Q250,318 236,306 Q224,322 212,308 Q200,324 188,308 Q176,322 164,306 Q150,318 140,298 Z';

export const renaissance: Clothes = {
  hem: 488,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={PEPLUM} color={shade(palette.main, -0.15)} look={look} part="peplum" />
      <Garment path={LONG_TOP} color={palette.main} look={look} part="doublet" />
      <path d="M186,310 L186,456 M214,310 L214,456" stroke={palette.accent} strokeWidth={5} />
      {[340, 370, 400, 430].map((y) => <circle key={y} cx={200} cy={y} r={5} fill={palette.accent} />)}
      <Patch path={RUFF} color="#f6f1e4" look={look} part="ruff" width={3.5} />
    </g>
  ),
};
