import type { FC } from 'react';
import { ChalkBox, ChalkShape, Fill, Placed, Ridge } from './parts.tsx';
import { CornerProps, spread } from './sceneryParts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A castle on a hill, giz style: a keep with two round towers and pennants behind the characters, stone walls on the
// sides, a grassy yard with a dirt path; chalk lines on the stones. A made-up castle.

const palette = {
  skyTop: '#4b5f7a',
  skyBottom: '#b3c4cf',
  cloud: '#dfe6ea',
  hills: '#6f8f7e',
  stone: '#9a97a6',
  stoneShade: '#77748a',
  stoneDark: '#55536a',
  roof: '#3d6f8a',
  pennant: '#e8735a',
  pennant2: '#f2b134',
  window: '#f2c46b',
  gate: '#5b4033',
  grassFar: '#7da36f',
  grass: '#5f8a5e',
  path: '#b5a58a',
  wood: '#7a5236',
  hay: '#e6c36a',
  foreground: '#23262e',
};

// Battlements along the top of a wall from `left` to `right` (units), at `top`.
const merlons = (left: number, right: number, top: number) =>
  spread(Math.max(2, Math.round((right - left) / 44)), left, right - 24).map((x) => `M ${x} ${top} h 24 v -26 h -24 Z`).join(' ');

// A round tower `height` units tall on (0, 0) with a pointed roof and a pennant.
const Tower: FC<Readonly<{ colors: Palette; height: number; seed: string; flag: string }>> = ({ colors, height, seed, flag }) => (
  <g>
    <ChalkBox x={-50} y={-height} width={100} height={height} fill={colors.stone} chalk={{ seed, width: 4 }} />
    <rect x={-12} y={-height * 0.7} width={24} height={40} rx={12} fill={colors.window} />
    <ChalkShape path={`M -64 ${-height} L 0 ${-height - 120} L 64 ${-height} Z`} fill={colors.roof} chalk={{ seed: `${seed}-roof`, width: 4 }} />
    <path d={`M 0 ${-height - 120} V ${-height - 170}`} stroke={colors.stoneDark} strokeWidth={5} />
    <path d={`M 0 ${-height - 170} L 54 ${-height - 155} L 0 ${-height - 140} Z`} fill={flag} />
  </g>
);

const Keep: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <Placed x={-140} y={0} scale={1}><Tower colors={colors} height={230} seed="castle-tower-left" flag={colors.pennant} /></Placed>
    <Placed x={140} y={0} scale={1}><Tower colors={colors} height={260} seed="castle-tower-right" flag={colors.pennant2} /></Placed>
    <path d={merlons(-90, 90, -200)} fill={colors.stoneShade} />
    <ChalkBox x={-90} y={-200} width={180} height={200} fill={colors.stoneShade} chalk={{ seed: 'castle-keep', width: 4 }} />
    <ChalkShape path="M -40 0 V -70 Q 0 -110 40 -70 V 0 Z" fill={colors.gate} chalk={{ seed: 'castle-gate', width: 4 }} />
    <path d="M -24 -80 V 0 M 0 -90 V 0 M 24 -80 V 0 M -40 -40 H 40" stroke={colors.stoneDark} strokeWidth={5} />
    {[-50, 50].map((x) => <rect key={x} x={x - 10} y={-160} width={20} height={34} rx={10} fill={colors.window} />)}
  </g>
);

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  const base = focus.y + 140 * unit;
  return (
    <>
      <Fill id="castle-sky" layer={layer} stops={[[0, colors.skyTop], [1, colors.skyBottom]]} to={horizon} />
      {[[0.26, 0.12], [0.62, 0.2], [0.9, 0.08]].map(([at, y]) => <ellipse key={at} cx={width * at!} cy={horizon * y!} rx={130 * unit} ry={30 * unit} fill={colors.cloud} opacity={0.7} />)}
      <Ridge base={horizon + 10 * unit} fill={colors.hills} chalk={{ seed: 'castle-hill', width: 4 * unit }} points={[[-width * 0.1, horizon - 60 * unit], [focus.x - 280 * unit, base + 10 * unit], [focus.x + 280 * unit, base + 10 * unit], [width * 1.1, horizon - 80 * unit]]} />
      <Placed x={focus.x} y={base + 14 * unit} scale={unit * 0.8}><Keep colors={colors} /></Placed>
    </>
  );
};

// A stretch of the outer wall from the frame's edge inward, with battlements and a torch bracket.
const Wall: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <path d={merlons(-140, 300, -300)} fill={colors.stone} />
    <ChalkBox x={-140} y={-300} width={440} height={300} fill={colors.stone} chalk={{ seed, width: 5 }} />
    <path d="M -140 -200 H 300 M -140 -100 H 300 M -40 -300 V -200 M 120 -300 V -200 M 40 -200 V -100 M 220 -200 V -100 M -40 -100 V 0 M 140 -100 V 0" stroke={colors.stoneShade} strokeWidth={5} />
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon } = backdrop;
  return (
    <>
      <Fill id="castle-grass" layer={layer} stops={[[0, colors.grassFar], [1, colors.grass]]} from={horizon} />
      <path d={`M ${width * 0.47} ${horizon} Q ${width * 0.45} ${horizon + 120 * unit} ${width * 0.3} ${layer.height * 1.1} H ${width * 0.7} Q ${width * 0.55} ${horizon + 120 * unit} ${width * 0.53} ${horizon} Z`} fill={colors.path} opacity={0.7} />
      <Placed x={-width * 0.02} y={horizon + 30 * unit} scale={unit * 0.75}><Wall colors={colors} seed="castle-wall-left" /></Placed>
      <Placed x={width * 1.02} y={horizon + 30 * unit} scale={unit * 0.75} flip><Wall colors={colors} seed="castle-wall-right" /></Placed>
    </>
  );
};

// A hay bale leaning on a barrel.
const Barrel: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -220 60 L -220 -150 Q -120 -200 -20 -150 L -20 60 Z" fill={colors.hay} chalk={{ seed: 'castle-hay', width: 5 }} />
    <path d="M -200 -100 Q -120 -130 -40 -100 M -200 -40 Q -120 -70 -40 -40" stroke={colors.wood} strokeWidth={6} fill="none" opacity={0.5} />
    <ChalkShape path="M 0 60 Q -20 -110 10 -230 H 150 Q 180 -110 160 60 Z" fill={colors.wood} chalk={{ seed: 'castle-barrel', width: 5 }} />
    <path d="M 4 -170 H 156 M -6 -40 H 166" stroke={colors.foreground} strokeWidth={10} />
  </g>
);

const Front: FC<LayerProps> = (layer) => <CornerProps layer={layer}><Barrel colors={layer.colors} /></CornerProps>;

export const medievalCastle: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
