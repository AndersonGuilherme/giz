import type { FC } from 'react';
import { ChalkBox, ChalkDisc, ChalkShape, Fill, Glow, Placed } from './parts.tsx';
import { CornerProps, spread } from './sceneryParts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A 1950s diner, giz style: a mint wall with a coral stripe, a neon milkshake sign behind the characters, menu boards,
// a long counter with stools, a checkered floor and a jukebox in each corner; chalk lines on the furniture.

// The neon sign: a milkshake glass with a straw and a cherry, in pink tubes.
const Neon: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M -70 -60 L -45 90 H 45 L 70 -60 Z M -90 -60 H 90 M 20 -60 L 50 -140 L 80 -140" stroke={colors.neonGlow} strokeWidth={22} opacity={0.35} />
    <path d="M -70 -60 L -45 90 H 45 L 70 -60 Z M -90 -60 H 90 M 20 -60 L 50 -140 L 80 -140" stroke={colors.neon} strokeWidth={10} />
    <path d="M -50 -60 Q -30 -110 0 -96 Q 40 -110 50 -60" stroke={colors.menuLine} strokeWidth={8} />
    <circle cx={-6} cy={-112} r={14} fill={colors.stripe} />
  </g>
);

const Menu: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <ChalkBox x={-110} y={-80} width={220} height={160} corner={10} fill={colors.menu} chalk={{ seed, width: 4 }} />
    <path d={spread(4, -46, 46).map((y, index) => `M -80 ${y} H ${30 + (index % 2) * 30} M 56 ${y} H 80`).join(' ')} stroke={colors.menuLine} strokeWidth={7} strokeLinecap="round" opacity={0.8} />
  </g>
);

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  return (
    <>
      <Fill id="diner-wall" layer={layer} stops={[[0, colors.wallTop], [0.5, colors.wall], [1, colors.wall]]} to={horizon} />
      <rect x={-width * 0.1} y={horizon - 330 * unit} width={width * 1.2} height={40 * unit} fill={colors.stripe} />
      <rect x={-width * 0.1} y={horizon - 278 * unit} width={width * 1.2} height={10 * unit} fill={colors.stripe} />
      <Glow id="diner-neon-glow" x={focus.x} y={focus.y} radius={260 * unit} color={colors.neon} opacity={0.35} />
      <Placed x={focus.x} y={focus.y} scale={unit}><Neon colors={colors} /></Placed>
      <Placed x={width * 0.17} y={focus.y + 30 * unit} scale={unit}><Menu colors={colors} seed="diner-menu-left" /></Placed>
      <Placed x={width * 0.83} y={focus.y + 30 * unit} scale={unit}><Menu colors={colors} seed="diner-menu-right" /></Placed>
      <ChalkDisc x={width * 0.83} y={focus.y - 150 * unit} radius={44 * unit} fill={colors.clock} chalk={{ seed: 'diner-clock', width: 4 * unit }} />
      <path d={`M ${width * 0.83} ${focus.y - 150 * unit} v ${-30 * unit} M ${width * 0.83} ${focus.y - 150 * unit} h ${22 * unit}`} stroke={colors.menu} strokeWidth={5 * unit} strokeLinecap="round" />
    </>
  );
};

// The checkered floor in perspective: columns that close in toward the horizon, rows that grow toward the viewer.
const Checkers: FC<LayerProps> = ({ colors, width, height, backdrop }) => {
  const depth = height * 1.1 - backdrop.horizon;
  const rows = spread(9, 0, 1).map((share) => ({ y: backdrop.horizon + depth * share * share, narrow: 0.3 + 0.7 * share * share }));
  const columns = spread(21, -1.5, 2.5).map((at) => width * at);
  const across = (x: number, narrow: number) => width / 2 + (x - width / 2) * narrow;
  const tiles = rows.slice(0, -1).flatMap((top, row) => columns.slice(0, -1).map((left, column) => {
    if ((row + column) % 2) return '';
    const [right, bottom] = [columns[column + 1]!, rows[row + 1]!];
    return `M ${across(left, top.narrow)} ${top.y} L ${across(right, top.narrow)} ${top.y} L ${across(right, bottom.narrow)} ${bottom.y} L ${across(left, bottom.narrow)} ${bottom.y} Z`;
  }));
  return <path d={tiles.join(' ')} fill={colors.floorDark} />;
};

const Stool: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <rect x={-6} y={-90} width={12} height={90} fill={colors.chrome} />
    <ellipse cx={0} cy={0} rx={30} ry={8} fill={colors.chrome} />
    <ChalkBox x={-40} y={-112} width={80} height={24} corner={12} fill={colors.stool} chalk={{ seed: 'diner-stool', width: 3.5 }} />
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon } = backdrop;
  return (
    <>
      <Fill id="diner-floor" layer={layer} stops={[[0, colors.floorLight], [1, colors.floorLight]]} from={horizon} />
      <Checkers {...layer} />
      <ChalkBox x={-width * 0.1} y={horizon - 150 * unit} width={width * 1.2} height={150 * unit} fill={colors.counter} chalk={{ seed: 'diner-counter', width: 4 * unit }} />
      <ChalkBox x={-width * 0.1} y={horizon - 170 * unit} width={width * 1.2} height={24 * unit} corner={8 * unit} fill={colors.counterTop} chalk={{ seed: 'diner-top', width: 4 * unit }} />
      <rect x={-width * 0.1} y={horizon - 90 * unit} width={width * 1.2} height={10 * unit} fill={colors.chrome} />
      {spread(7, 0.04, 0.96).map((at) => <Placed key={at} x={width * at} y={horizon + 20 * unit} scale={unit}><Stool colors={colors} /></Placed>)}
    </>
  );
};

const Jukebox: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -180 60 V -260 Q -180 -400 -20 -400 Q 140 -400 140 -260 V 60 Z" fill={colors.jukebox} chalk={{ seed: 'diner-jukebox', width: 5 }} />
    <path d="M -140 -250 Q -140 -360 -20 -360 Q 100 -360 100 -250 V -170 H -140 Z" fill={colors.jukeboxLight} />
    <path d="M -120 -120 H 80 M -120 -80 H 80 M -120 -40 H 80" stroke={colors.foreground} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
  </g>
);

const Front: FC<LayerProps> = (layer) => <CornerProps layer={layer}><Jukebox colors={layer.colors} /></CornerProps>;

export const fiftiesDiner: VectorBackgroundModel = { layers: [Back, Middle, Front] };
