import type { FC } from 'react';
import type { Hair as HairName, Look } from './parameters.ts';
import { shade } from '../svg.ts';

type Layer = 'back' | 'front';
type Piece = FC<Readonly<{ look: Look }>>;

const Nothing: Piece = () => null;

const BunBack: Piece = ({ look }) => <circle cx={200} cy={22} r={38} fill={look.headColor} />;
const BunFront: Piece = ({ look }) => <ellipse cx={200} cy={46} rx={28} ry={9} fill={look.accessoryColor} />;

const Short: Piece = ({ look }) => (
  <g>
    <path
      d="M84,110 C96,40 150,22 176,30 C182,10 214,6 226,26 C258,14 300,40 306,84 C320,92 326,110 324,124 C290,80 250,66 200,68 C150,66 110,80 84,110 Z"
      fill={look.headColor}
    />
    <path d="M150,38 C176,30 200,32 220,38" fill="none" stroke={shade(look.headColor, 0.25)} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Scarf: Piece = ({ look }) => (
  <g>
    <path d="M318,196 C350,214 362,250 350,282 C332,256 322,238 306,222 Z" fill={shade(look.accessoryColor, -0.14)} />
    <path d="M62,200 A140,140 0 1,1 338,200 Q200,-44 62,200 Z" fill={look.accessoryColor} />
    <path d="M96,72 C140,40 260,40 304,72 M74,120 C110,80 150,62 200,58" fill="none" stroke={shade(look.accessoryColor, -0.1)} strokeWidth={4} strokeLinecap="round" />
    <circle cx={330} cy={204} r={16} fill={shade(look.accessoryColor, -0.06)} />
  </g>
);

const Hat: Piece = ({ look }) => (
  <g>
    <path d="M134,58 C132,6 150,-12 200,-12 C250,-12 268,6 266,58 Z" fill={look.accessoryColor} />
    <path d="M133,34 L267,34 L266,56 L134,56 Z" fill={shade(look.accessoryColor, -0.35)} />
    <ellipse cx={200} cy={60} rx={150} ry={20} fill={shade(look.accessoryColor, -0.08)} />
  </g>
);

const PIECES: Readonly<Record<HairName, Readonly<Record<Layer, Piece>>>> = {
  none: { back: Nothing, front: Nothing },
  bun: { back: BunBack, front: BunFront },
  short: { back: Nothing, front: Short },
  scarf: { back: Nothing, front: Scarf },
  hat: { back: Nothing, front: Hat },
};

/** Hair or headwear: `back` is drawn behind the head, `front` over it. */
export const Hair: FC<Readonly<{ look: Look; layer: Layer }>> = ({ look, layer }) => {
  const Piece = PIECES[look.hair][layer];
  return <Piece look={look} />;
};
