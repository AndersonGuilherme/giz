import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { LONG_TOP } from '../shapes.ts';

// Steel armor (the sleeve color) under a long tabard in the main color, a diamond emblem in the accent.
const TABARD = 'M152,296 C180,290 220,290 248,296 L262,524 L200,534 L138,524 Z';
const EMBLEM = 'M200,346 L226,380 L200,414 L174,380 Z';

export const knight: Clothes = {
  hem: 470,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={LONG_TOP} color={palette.sleeve} look={look} part="armor" />
      <path d="M130,340 Q200,356 270,340 M128,380 Q200,396 272,380" fill="none" stroke={shade(palette.sleeve, -0.25)} strokeWidth={3} />
      <Garment path={TABARD} color={palette.main} look={look} part="tabard" />
      <Patch path={EMBLEM} color={palette.accent} look={look} part="emblem" />
      <rect x={140} y={438} width={120} height={14} rx={5} fill={shade(palette.main, -0.45)} />
    </g>
  ),
};
