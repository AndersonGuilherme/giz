import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { SHIRT } from '../shapes.ts';

const HOOD = 'M90,300 C90,250 310,250 310,300 C300,326 100,326 90,300 Z';

// The hood behind the neck, a pocket, a ribbed hem and two drawstrings in the accent color.
export const hoodie: Clothes = {
  hem: 446,
  Torso: ({ look, palette }) => (
    <g>
      <Patch path={HOOD} color={shade(palette.main, -0.28)} look={look} part="hood" width={6} />
      <Garment path={SHIRT} color={palette.main} look={look} part="hoodie" />
      <rect x={116} y={436} width={168} height={22} rx={10} fill={shade(palette.main, -0.18)} />
      <path d="M150,410 L156,372 L244,372 L250,410 Z" fill={shade(palette.main, -0.12)} />
      <path d="M182,304 v40 M218,304 v40" stroke={palette.accent} strokeWidth={5} strokeLinecap="round" />
      <circle cx={182} cy={348} r={5} fill={palette.accent} />
      <circle cx={218} cy={348} r={5} fill={palette.accent} />
    </g>
  ),
};
