import type { FC } from 'react';
import { FOCUS_RADIUS } from '../../../../domain/scenario/BackdropLayout.ts';
import { ChalkBox, ChalkDisc, ChalkShape, Fill, Glow, Placed } from './parts.tsx';
import { CornerProps, FloorLines, spread } from './sceneryParts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A classroom in the morning, giz style: a chalkboard with doodles behind the characters (our own chalk, on a board),
// sunny windows, a clock, desks on the sides and a wooden floor; chalk lines on the furniture.

const palette = {
  wallTop: '#7fa898',
  wall: '#a7c9bb',
  wainscot: '#e9e2d0',
  board: '#2f4a43',
  boardFrame: '#a07a52',
  chalk: '#f3efe2',
  glass: '#d9f0f4',
  sky: '#a7d8ec',
  windowFrame: '#f3efe2',
  sun: '#fff1c4',
  clock: '#f3efe2',
  poster: '#f2b134',
  desk: '#d29a62',
  deskLeg: '#4a4f5a',
  floorFar: '#d8b48c',
  floor: '#c09a72',
  plank: '#a07a58',
  plant: '#4f8a5b',
  pot: '#e8735a',
  book: '#3d6fb0',
  foreground: '#2a3634',
};

// The chalkboard is drawn 232 units to each side and scaled into the backdrop's focus radius.
const BOARD_HALF_WIDTH = 232;

// The chalkboard: a + b = ?, a triangle, a little sun and an arrow, drawn in chalk.
const Board: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkBox x={-232} y={-128} width={464} height={256} corner={8} fill={colors.boardFrame} chalk={{ seed: 'class-frame', width: 5 }} />
    <rect x={-216} y={-112} width={432} height={224} rx={4} fill={colors.board} />
    <g stroke={colors.chalk} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9}>
      <path d="M -180 -40 Q -160 -70 -150 -40 Q -160 -20 -180 -40 M -120 -52 V -20 M -136 -36 H -104 M -80 -60 V -20 Q -60 -30 -80 -40" />
      <path d="M -30 -44 H 0 M -30 -32 H 0 M 30 -60 Q 50 -72 56 -56 Q 56 -44 40 -38 V -28 M 40 -14 V -12" />
      <path d="M -170 80 L -110 0 L -50 80 Z M 110 40 m -26 0 a 26 26 0 1 0 52 0 a 26 26 0 1 0 -52 0 M 110 -6 V -18 M 150 40 H 164 M 56 40 H 70" />
      <path d="M -20 70 H 40 M 28 58 L 40 70 L 28 82" />
    </g>
    <rect x={-120} y={112} width={240} height={14} fill={colors.boardFrame} />
  </g>
);

const Window: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <ChalkBox x={-100} y={-150} width={200} height={300} corner={6} fill={colors.sky} chalk={{ seed, width: 5 }} />
    <circle cx={50} cy={-90} r={30} fill={colors.sun} />
    <path d="M 0 -150 V 150 M -100 0 H 100" stroke={colors.windowFrame} strokeWidth={12} />
    <rect x={-100} y={-150} width={200} height={300} rx={6} fill="none" stroke={colors.windowFrame} strokeWidth={14} />
  </g>
);

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  return (
    <>
      <Fill id="class-wall" layer={layer} stops={[[0, colors.wallTop], [0.6, colors.wall], [1, colors.wall]]} to={horizon} />
      <rect x={-width * 0.1} y={horizon - 120 * unit} width={width * 1.2} height={120 * unit} fill={colors.wainscot} />
      {[0.1, 0.9].map((at) => <Glow key={at} id={`class-sun${at}`} x={width * at} y={focus.y + 40 * unit} radius={300 * unit} color={colors.sun} opacity={0.5} />)}
      <Placed x={width * 0.1} y={focus.y + 40 * unit} scale={unit}><Window colors={colors} seed="class-window-left" /></Placed>
      <Placed x={width * 0.9} y={focus.y + 40 * unit} scale={unit}><Window colors={colors} seed="class-window-right" /></Placed>
      <Placed x={focus.x} y={focus.y} scale={(unit * FOCUS_RADIUS) / BOARD_HALF_WIDTH}><Board colors={colors} /></Placed>
      <ChalkDisc x={focus.x} y={focus.y - 150 * unit} radius={30 * unit} fill={colors.clock} chalk={{ seed: 'class-clock', width: 3.5 * unit }} />
      <path d={`M ${focus.x} ${focus.y - 150 * unit} v ${-18 * unit} M ${focus.x} ${focus.y - 150 * unit} h ${14 * unit}`} stroke={colors.foreground} strokeWidth={4 * unit} strokeLinecap="round" />
    </>
  );
};

// A pupil's desk with a chair, seen from the front, standing on (0, 0).
const Desk: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <path d="M -70 0 V -110 M 70 0 V -110" stroke={colors.deskLeg} strokeWidth={10} />
    <ChalkBox x={-90} y={-130} width={180} height={24} corner={6} fill={colors.desk} chalk={{ seed, width: 4 }} />
    <rect x={-50} y={-160} width={70} height={30} rx={4} fill={colors.book} />
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon } = backdrop;
  return (
    <>
      <Fill id="class-floor" layer={layer} stops={[[0, colors.floorFar], [1, colors.floor]]} from={horizon} />
      <FloorLines layer={layer} color={colors.plank} count={15} opacity={0.5} />
      {spread(2, 0.06, 0.2).map((at) => <Placed key={at} x={width * at} y={horizon + 40 * unit} scale={unit}><Desk colors={colors} seed={`class-desk${at}`} /></Placed>)}
      {spread(2, 0.8, 0.94).map((at) => <Placed key={at} x={width * at} y={horizon + 40 * unit} scale={unit}><Desk colors={colors} seed={`class-desk${at}`} /></Placed>)}
    </>
  );
};

// A potted plant beside a stack of books.
const Plant: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    {[-40, -10, 25, 60].map((angle) => <path key={angle} d="M 0 0 Q 40 -120 0 -260 Q -40 -120 0 0 Z" fill={colors.plant} transform={`translate(20 -150) rotate(${angle})`} />)}
    <ChalkShape path="M -60 -150 H 100 L 80 60 H -40 Z" fill={colors.pot} chalk={{ seed: 'class-pot', width: 5 }} />
    <ChalkBox x={120} y={-80} width={80} height={36} corner={4} fill={colors.book} chalk={{ seed: 'class-book1', width: 4 }} />
    <ChalkBox x={110} y={-44} width={90} height={44} corner={4} fill={colors.poster} chalk={{ seed: 'class-book2', width: 4 }} />
  </g>
);

const Front: FC<LayerProps> = (layer) => <CornerProps layer={layer}><Plant colors={layer.colors} /></CornerProps>;

export const classroom: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
