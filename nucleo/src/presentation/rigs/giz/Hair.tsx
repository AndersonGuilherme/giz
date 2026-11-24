import type { FC } from 'react';
import { Silhouette } from '../../../domain/drawing/Silhouette.ts';
import { Chalked } from './Chalked.tsx';
import type { Hair as HairName, Look } from './parameters.ts';
import { shade } from '../svg.ts';

type Layer = 'back' | 'front';
type Piece = FC<Readonly<{ look: Look }>>;

const Nothing: Piece = () => null;

const BUN = Silhouette.ellipse({ x: 200, y: 22 }, 38, 38);
const SHORT = 'M80,118 C88,44 146,18 182,30 C196,10 226,12 236,30 C276,22 316,52 320,118 C304,92 286,80 262,78'
  + ' C246,96 214,100 196,86 C170,100 128,96 116,80 C100,86 88,100 80,118 Z';
const CROWN = 'M134,58 C132,6 150,-12 200,-12 C250,-12 268,6 266,58 Z';

const BunBack: Piece = ({ look }) => (
  <g>
    <path d={BUN.path()} fill={look.hairColor} />
    <Chalked look={look} outline={BUN} part="bun" />
  </g>
);

// A cap of hair with a wavy fringe over the forehead.
const Short: Piece = ({ look }) => (
  <g>
    <path d={SHORT} fill={look.hairColor} />
    <path d="M150,44 C176,34 206,36 228,46" fill="none" stroke={shade(look.hairColor, 0.25)} strokeWidth={4} strokeLinecap="round" />
    <Chalked look={look} outline={Silhouette.parse(SHORT)} part="hair" />
  </g>
);

// The hair with a tie where the bun meets the head.
const BunFront: Piece = ({ look }) => (
  <g>
    <Short look={look} />
    <ellipse cx={200} cy={44} rx={24} ry={8} fill={look.accessoryColor} />
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
    <path d={CROWN} fill={look.accessoryColor} />
    <path d="M133,34 L267,34 L266,56 L134,56 Z" fill={shade(look.accessoryColor, -0.35)} />
    <Chalked look={look} outline={Silhouette.parse(CROWN)} part="hat" />
    <ellipse cx={200} cy={60} rx={150} ry={20} fill={shade(look.accessoryColor, -0.08)} />
    <Chalked look={look} outline={Silhouette.ellipse({ x: 200, y: 60 }, 150, 20)} part="brim" />
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
