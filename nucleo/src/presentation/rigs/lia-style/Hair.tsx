import type { FC } from 'react';
import type { Hair as HairName } from './parameters.ts';

type Layer = 'back' | 'front';
type Piece = FC;

// Lia's fringe from the motor: the top of the hair with a strand down the right side and a lock out to the left.
const FRINGE = [
  'M78,182 C60,95 130,48 205,50 C285,52 330,105 322,190 C318,160 300,138 282,132 L296,214 C262,206 238,180 232,140 C190,180 130,196 78,182 Z',
  'M78,182 C70,150 40,140 30,150 C50,158 62,170 78,182 Z',
];

const Nothing: Piece = () => null;
const Fringe: Piece = () => <g>{FRINGE.map((path) => <path key={path} d={path} />)}</g>;

const Bun: Piece = () => (
  <g>
    <circle cx={285} cy={62} r={52} />
    <Fringe />
  </g>
);

// Téo's spiky short hair from the motor.
const Short: Piece = () => (
  <g>
    <path d="M82,188 C62,100 120,40 200,42 C250,30 300,52 318,96 C336,120 330,160 320,196 C314,168 300,150 286,142 C294,128 296,118 292,104 C262,136 200,140 150,146 C120,150 96,166 82,188 Z" />
    <path d="M150,58 C170,20 220,14 252,30 C226,30 206,40 196,56 Z" />
    <path d="M286,74 C312,62 336,74 342,100 C326,88 310,86 300,92 Z" />
    <path d="M300,128 C322,130 336,150 334,176 C324,160 312,152 304,152 Z" />
  </g>
);

// Long hair: a back panel falling behind the head to the shoulders, under the same fringe.
const LongBack: Piece = () => (
  <path d="M84,200 C66,96 130,48 200,48 C270,48 334,96 316,200 C322,250 334,300 338,336 C310,350 284,344 270,326 L130,326 C116,344 90,350 62,336 C66,300 78,250 84,200 Z" />
);

// A buzz cut: a thin, translucent cap over the top of the head.
const Shaved: Piece = () => (
  <path opacity={0.55} d="M88,160 C92,96 140,64 200,64 C260,64 308,96 312,160 C290,118 250,104 200,104 C150,104 110,118 88,160 Z" />
);

const PIECES: Readonly<Record<HairName, Readonly<Record<Layer, Piece>>>> = {
  long: { back: LongBack, front: Fringe },
  short: { back: Nothing, front: Short },
  shaved: { back: Nothing, front: Shaved },
  bun: { back: Nothing, front: Bun },
};

/** Hair in the gradient `fill`: `back` is drawn behind the head, `front` over the face (under the brows). */
export const Hair: FC<Readonly<{ hair: HairName; layer: Layer; fill: string }>> = ({ hair, layer, fill }) => {
  const Piece = PIECES[hair][layer];
  return <g fill={fill}><Piece /></g>;
};
