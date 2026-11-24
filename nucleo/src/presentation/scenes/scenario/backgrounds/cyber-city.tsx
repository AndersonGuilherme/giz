import type { FC } from 'react';
import { ChalkBox, ChalkShape, Fill, Glow, Placed } from './parts.tsx';
import { CornerProps, spread } from './sceneryParts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A future city at night, giz style: a violet haze, giant towers with neon edges, a hologram ring behind the
// characters, flying cars, near buildings with neon signs (shapes, no brands) and a wet street that reflects the neon.

// Far towers: [x as a fraction of the width, width and height in units, neon color key].
const TOWERS = [[0.04, 130, 560, 'cyan'], [0.16, 100, 680, 'pink'], [0.28, 140, 480, 'yellow'], [0.66, 120, 620, 'cyan'], [0.78, 150, 720, 'pink'], [0.92, 110, 520, 'cyan']] as const;

const Tower: FC<Readonly<{ colors: Palette; wide: number; tall: number; neon: string; seed: string }>> = ({ colors, wide, tall, neon, seed }) => (
  <g>
    <ChalkShape path={`M 0 0 V ${-tall + 40} L ${wide / 2} ${-tall} L ${wide} ${-tall + 40} V 0 Z`} fill={colors.tower} chalk={{ seed, width: 3.5, color: neon }} />
    <path d={spread(Math.floor(tall / 90), 60, tall - 80).map((y) => `M 16 ${-y} H ${wide - 16}`).join(' ')} stroke={colors.window} strokeWidth={6} opacity={0.35} />
  </g>
);

// The hologram: two rings and a turning hexagon, 150 units in radius.
const Hologram: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g fill="none" strokeLinecap="round">
    <circle r={140} stroke={colors.cyan} strokeWidth={6} opacity={0.6} strokeDasharray="40 18" />
    <circle r={110} stroke={colors.pink} strokeWidth={4} opacity={0.5} />
    <path d="M 0 -70 L 61 -35 L 61 35 L 0 70 L -61 35 L -61 -35 Z" fill={colors.cyan} fillOpacity={0.18} stroke={colors.cyan} strokeWidth={8} />
    <path d="M 0 -70 V 70 M -61 -35 L 61 35 M 61 -35 L -61 35" stroke={colors.cyan} strokeWidth={3} opacity={0.6} />
  </g>
);

const Car: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <path d="M -50 0 Q -40 -26 0 -28 Q 40 -26 50 0 Z" fill={colors.car} />
    <rect x={-56} y={0} width={112} height={12} rx={6} fill={colors.near} />
    <circle cx={-44} cy={14} r={5} fill={colors.pink} />
    <circle cx={44} cy={14} r={5} fill={colors.cyan} />
  </g>
);

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  const neon: Readonly<Record<string, string>> = { cyan: colors.cyan!, pink: colors.pink!, yellow: colors.yellow! };
  return (
    <>
      <Fill id="cyber-sky" layer={layer} stops={[[0, colors.skyTop], [1, colors.skyBottom]]} to={horizon} />
      <Glow id="cyber-haze" x={width * 0.5} y={horizon} radius={width * 0.6} color={colors.haze} opacity={0.3} />
      {TOWERS.map(([at, wide, tall, color]) => (
        <Placed key={at} x={width * at} y={horizon} scale={unit}><Tower colors={colors} wide={wide} tall={tall} neon={neon[color]!} seed={`cyber-tower${at}`} /></Placed>
      ))}
      <Glow id="cyber-holo-glow" x={focus.x} y={focus.y} radius={220 * unit} color={colors.cyan} opacity={0.3} />
      <Placed x={focus.x} y={focus.y} scale={unit}><Hologram colors={colors} /></Placed>
      <Placed x={focus.x + 130 * unit} y={focus.y - 185 * unit} scale={unit * 0.8}><Car colors={colors} /></Placed>
      <Placed x={width * 0.72} y={focus.y + 60 * unit} scale={unit * 0.6}><Car colors={colors} /></Placed>
    </>
  );
};

// A near building from the frame's edge inward, with a neon sign of plain shapes (a bowl, a star, stripes).
const Building: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <ChalkBox x={-200} y={-620} width={400} height={620} fill={colors.near} chalk={{ seed, width: 5, color: colors.pink }} />
    <ChalkBox x={30} y={-520} width={120} height={200} corner={14} fill={colors.near} chalk={{ seed: `${seed}-sign`, width: 6, color: colors.cyan }} />
    <path d="M 56 -470 Q 90 -420 124 -470 Z M 90 -400 L 98 -380 L 120 -380 L 102 -366 L 108 -344 L 90 -357 L 72 -344 L 78 -366 L 60 -380 L 82 -380 Z" fill={colors.yellow} />
    <path d="M -150 -200 H 150 M -150 -170 H 150" stroke={colors.pink} strokeWidth={10} opacity={0.8} />
    <ChalkBox x={-60} y={-140} width={200} height={140} corner={6} fill={colors.window} chalk={{ seed: `${seed}-door`, width: 4 }} />
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon } = backdrop;
  const reflections = [[0.2, colors.pink], [0.45, colors.cyan], [0.6, colors.yellow], [0.82, colors.cyan]] as const;
  return (
    <>
      <Fill id="cyber-street" layer={layer} stops={[[0, colors.streetFar], [1, colors.street]]} from={horizon} />
      {reflections.map(([at, color]) => <rect key={at} x={width * at - 8 * unit} y={horizon + 10 * unit} width={16 * unit} height={layer.height} fill={color} opacity={0.25} />)}
      <path d={spread(5, 0.1, 0.9).map((at) => `M ${width * at} ${horizon + 60 * unit} h ${80 * unit}`).join(' ')} stroke={colors.cyan} strokeWidth={6 * unit} opacity={0.7} />
      <Placed x={-width * 0.03} y={horizon + 20 * unit} scale={unit * 0.8}><Building colors={colors} seed="cyber-near-left" /></Placed>
      <Placed x={width * 1.03} y={horizon + 20 * unit} scale={unit * 0.8} flip><Building colors={colors} seed="cyber-near-right" /></Placed>
    </>
  );
};

// A street post with a neon ring and a bundle of cables.
const Post: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkBox x={-40} y={-420} width={80} height={480} corner={20} fill={colors.foreground} chalk={{ seed: 'cyber-post', width: 5, color: colors.cyan }} />
    <rect x={-40} y={-360} width={80} height={16} fill={colors.pink} />
    <path d="M 40 -300 Q 120 -200 200 -260 M 40 -260 Q 140 -140 210 -190" stroke={colors.foreground} strokeWidth={14} fill="none" />
  </g>
);

const Front: FC<LayerProps> = (layer) => <CornerProps layer={layer}><Post colors={layer.colors} /></CornerProps>;

export const cyberCity: VectorBackgroundModel = { layers: [Back, Middle, Front] };
