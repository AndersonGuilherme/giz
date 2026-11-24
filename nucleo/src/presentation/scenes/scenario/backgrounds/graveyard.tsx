import type { FC } from 'react';
import { ChalkBox, ChalkShape, Fill, Glow, Placed, Ridge, Stars } from './parts.tsx';
import { CornerProps, Fog, Moon, spread } from './sceneryParts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// An old churchyard at night, spooky but cute, giz style: a big moon clear of the HUD, a little chapel with warm
// windows behind the characters, a curly bare tree, two friendly bats, rounded headstones with a flower carved on
// them, smiling pumpkin lanterns and bands of fog. No skulls, no bones, nothing gory.

const Chapel: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -20 -250 L 0 -300 L 20 -250 Z" fill={colors.roof} chalk={{ seed: 'grave-spire', width: 4 }} />
    <ChalkBox x={-30} y={-250} width={60} height={110} fill={colors.chapel} chalk={{ seed: 'grave-belfry', width: 4 }} />
    <ChalkShape path="M -130 -60 L 0 -150 L 130 -60 Z" fill={colors.roof} chalk={{ seed: 'grave-roof', width: 4 }} />
    <ChalkBox x={-110} y={-60} width={220} height={140} fill={colors.chapel} chalk={{ seed: 'grave-chapel', width: 4 }} />
    {[-60, 60].map((x) => <path key={x} d={`M ${x - 16} 20 V -10 Q ${x} -34 ${x + 16} -10 V 20 Z`} fill={colors.window} />)}
    <path d="M -22 80 V 20 Q 0 -4 22 20 V 80 Z" fill={colors.roof} />
    <circle cx={0} cy={-200} r={12} fill={colors.window} />
  </g>
);

// A bare tree with curly branch tips, standing on (0, 0).
const CurlyTree: FC<Readonly<{ color: string }>> = ({ color }) => (
  <g fill="none" stroke={color} strokeLinecap="round">
    <path d="M 0 0 Q -10 -160 10 -300" strokeWidth={34} />
    <path d="M 6 -200 Q 70 -250 90 -320 Q 100 -350 80 -350 M 2 -150 Q -60 -190 -90 -260 Q -100 -290 -76 -286 M 10 -290 Q 0 -360 30 -380 Q 50 -390 44 -370" strokeWidth={14} />
  </g>
);

const Bat: FC<Readonly<{ color: string }>> = ({ color }) => (
  <g fill={color}>
    <path d="M 0 0 Q -20 -24 -56 -16 Q -40 -6 -44 8 Q -26 0 -14 10 Z M 0 0 Q 20 -24 56 -16 Q 40 -6 44 8 Q 26 0 14 10 Z" />
    <circle cx={0} cy={2} r={12} />
    <path d="M -8 -8 L -4 -18 L 0 -8 M 0 -8 L 4 -18 L 8 -8" />
  </g>
);

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  return (
    <>
      <Fill id="grave-sky" layer={layer} stops={[[0, colors.skyTop], [1, colors.skyBottom]]} to={horizon} />
      <Stars color={colors.star} width={width} height={horizon * 0.7} unit={unit} />
      <Moon layer={layer} color={colors.moon} glow={colors.moonGlow} seed="grave-moon" />
      <Ridge base={horizon + 10 * unit} fill={colors.hills} chalk={{ seed: 'grave-hill', width: 4 * unit }} points={[[-width * 0.1, horizon - 60 * unit], [focus.x - 260 * unit, focus.y + 150 * unit], [focus.x + 260 * unit, focus.y + 150 * unit], [width * 1.1, horizon - 80 * unit]]} />
      <Glow id="grave-chapel-glow" x={focus.x} y={focus.y + 40 * unit} radius={200 * unit} color={colors.window} opacity={0.25} />
      <Placed x={focus.x} y={focus.y + 80 * unit} scale={unit * 0.85}><Chapel colors={colors} /></Placed>
      <Placed x={width * 0.12} y={horizon - 20 * unit} scale={unit}><CurlyTree color={colors.tree} /></Placed>
      <Placed x={width * 0.36} y={focus.y - 110 * unit} scale={unit}><Bat color={colors.bat} /></Placed>
      <Placed x={width * 0.62} y={focus.y - 170 * unit} scale={unit * 0.7}><Bat color={colors.bat} /></Placed>
    </>
  );
};

// A rounded headstone with a carved flower, standing on (0, 0).
const Headstone: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <ChalkShape path="M -60 0 V -120 Q -60 -180 0 -180 Q 60 -180 60 -120 V 0 Z" fill={colors.stone} chalk={{ seed, width: 4 }} />
    <path d="M 0 -40 V -90" stroke={colors.carving} strokeWidth={6} />
    {spread(5, 0, 288).map((angle) => <circle key={angle} cx={18 * Math.cos((angle * Math.PI) / 180)} cy={-110 + 18 * Math.sin((angle * Math.PI) / 180)} r={10} fill={colors.carving} />)}
  </g>
);

const Pumpkin: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <Glow id={`${seed}-glow`} x={0} y={-40} radius={110} color={colors.pumpkin} opacity={0.35} />
    <ChalkShape path="M -56 0 Q -70 -70 0 -76 Q 70 -70 56 0 Q 0 10 -56 0 Z" fill={colors.pumpkin} chalk={{ seed, width: 4 }} />
    <path d="M -2 -76 Q 0 -96 12 -100" stroke={colors.grass} strokeWidth={8} fill="none" />
    <path d="M -30 -46 L -18 -56 L -8 -44 Z M 8 -44 L 18 -56 L 30 -46 Z M -30 -26 Q 0 -6 30 -26 Q 0 -16 -30 -26 Z" fill={colors.pumpkinFace} />
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon } = backdrop;
  const pickets = spread(Math.round(width / (36 * unit)), -0.05, 1.05).map((at) => `M ${width * at} ${horizon + 6 * unit} V ${horizon - 90 * unit} l ${6 * unit} ${-14 * unit} l ${6 * unit} ${14 * unit} V ${horizon + 6 * unit} Z`);
  return (
    <>
      <Fill id="grave-grass" layer={layer} stops={[[0, colors.grassFar], [1, colors.grass]]} from={horizon} />
      <path d={pickets.join(' ')} fill={colors.fence} />
      <rect x={-width * 0.1} y={horizon - 70 * unit} width={width * 1.2} height={8 * unit} fill={colors.fence} />
      {[[0.06, 1], [0.19, 0.8], [0.82, 0.85], [0.95, 1]].map(([at, size]) => <Placed key={at} x={width * at!} y={horizon + 30 * unit} scale={unit * size!}><Headstone colors={colors} seed={`grave-stone${at}`} /></Placed>)}
      <Placed x={width * 0.3} y={horizon + 40 * unit} scale={unit * 0.8}><Pumpkin colors={colors} seed="grave-pumpkin-left" /></Placed>
      <Placed x={width * 0.7} y={horizon + 34 * unit} scale={unit * 0.7}><Pumpkin colors={colors} seed="grave-pumpkin-right" /></Placed>
      <Fog layer={layer} y={horizon + 10 * unit} color={colors.fog} depth={110} opacity={0.3} />
    </>
  );
};

// A leaning headstone with a pumpkin at its foot, in the fog.
const Corner: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <g transform="translate(-20 40) rotate(8) scale(1.8)"><Headstone colors={{ ...colors, stone: colors.foreground!, carving: colors.hills! }} seed="grave-near-stone" /></g>
    <Placed x={130} y={-10} scale={1.2}><Pumpkin colors={colors} seed="grave-near-pumpkin" /></Placed>
  </g>
);

const Front: FC<LayerProps> = (layer) => (
  <>
    <CornerProps layer={layer}><Corner colors={layer.colors} /></CornerProps>
    <Fog layer={layer} y={layer.height * 1.02} color={layer.colors.fog!} depth={140} opacity={0.25} />
  </>
);

export const graveyard: VectorBackgroundModel = { layers: [Back, Middle, Front] };
