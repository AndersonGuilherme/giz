import type { FC } from 'react';
import { ChalkBox, ChalkDisc, ChalkShape, Fill, Placed, Ridge } from './parts.tsx';
import { CornerProps, FloorLines, spread } from './sceneryParts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// The deck of a sailing ship, giz style: the sea and a far island behind the rail, the mast with a big sail marked with
// a compass star behind the characters, rigging ropes, a plank deck and barrels; chalk lines on the wood and the sail.

const palette = {
  skyTop: '#2f5f7a',
  skyBottom: '#b5dcd8',
  cloud: '#f3efe2',
  seaFar: '#5aa6ad',
  sea: '#2f7f8a',
  foam: '#e3eef0',
  island: '#6f9a6a',
  sail: '#f1e6cc',
  sailShade: '#d8c7a3',
  mark: '#3d6f8a',
  mast: '#6b4630',
  rope: '#d9c08c',
  rail: '#5b3a26',
  deckFar: '#b07c52',
  deck: '#946540',
  plank: '#6e4a30',
  barrel: '#8a5a3a',
  hoop: '#3a2a22',
  foreground: '#3a2418',
};

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon } = backdrop;
  const sea = horizon - 150 * unit;
  const waves = spread(14, 0, 1).map((at) => `M ${width * at} ${sea + 40 * unit} q ${18 * unit} ${-10 * unit} ${36 * unit} 0`);
  return (
    <>
      <Fill id="ship-sky" layer={layer} stops={[[0, colors.skyTop], [1, colors.skyBottom]]} to={sea} />
      {[[0.3, 0.2], [0.78, 0.12]].map(([at, y]) => <ellipse key={at} cx={width * at!} cy={sea * y!} rx={140 * unit} ry={30 * unit} fill={colors.cloud} opacity={0.75} />)}
      <Ridge base={sea + 4 * unit} fill={colors.island} chalk={{ seed: 'ship-island', width: 3.5 * unit }} points={[[width * 0.66, sea + 2 * unit], [width * 0.74, sea - 40 * unit], [width * 0.82, sea - 24 * unit], [width * 0.9, sea + 2 * unit]]} />
      <Fill id="ship-sea" layer={layer} stops={[[0, colors.seaFar], [1, colors.sea]]} from={sea} />
      <path d={waves.join(' ')} stroke={colors.foam} strokeWidth={4 * unit} fill="none" opacity={0.7} />
    </>
  );
};

// The sail: a square sail bellied by the wind, with an original compass star on it.
const Sail: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -170 -150 Q 0 -120 170 -150 Q 200 0 170 150 Q 0 175 -170 150 Q -140 0 -170 -150 Z" fill={colors.sail} chalk={{ seed: 'ship-sail', width: 5 }} />
    <path d="M -150 0 Q 0 30 150 0 Q 0 60 -150 0 Z" fill={colors.sailShade} opacity={0.6} />
    <path d="M 0 -80 L 18 -18 L 80 0 L 18 18 L 0 80 L -18 18 L -80 0 L -18 -18 Z" fill={colors.mark} />
    <ChalkDisc x={0} y={0} radius={22} fill={colors.sail} chalk={{ seed: 'ship-star', width: 4 }} />
  </g>
);

// The rail along the horizon: posts and a top rail, from edge to edge.
const Rail: FC<LayerProps> = ({ colors, width, unit, backdrop }) => {
  const top = backdrop.horizon - 110 * unit;
  const posts = spread(Math.round(width / (70 * unit)), -0.05, 1.05).map((at) => `M ${width * at} ${top} V ${backdrop.horizon}`);
  return (
    <>
      <path d={posts.join(' ')} stroke={colors.rail} strokeWidth={14 * unit} />
      <ChalkBox x={-width * 0.1} y={top - 14 * unit} width={width * 1.2} height={22 * unit} fill={colors.rail} chalk={{ seed: 'ship-rail', width: 4 * unit }} />
    </>
  );
};

const Mast: FC<LayerProps> = ({ colors, width, height, unit, backdrop }) => {
  const { focus, horizon } = backdrop;
  const ropes = [-0.02, 0.18, 0.82, 1.02].map((at) => `M ${focus.x} ${focus.y - 210 * unit} L ${width * at} ${horizon - 110 * unit}`);
  return (
    <>
      <path d={ropes.join(' ')} stroke={colors.rope} strokeWidth={5 * unit} />
      <ChalkBox x={focus.x - 18 * unit} y={-height * 0.1} width={36 * unit} height={horizon + height * 0.1} fill={colors.mast} chalk={{ seed: 'ship-mast', width: 4 * unit }} />
      <ChalkBox x={focus.x - 210 * unit} y={focus.y - 166 * unit} width={420 * unit} height={18 * unit} corner={8 * unit} fill={colors.mast} chalk={{ seed: 'ship-yard', width: 4 * unit }} />
      <Placed x={focus.x} y={focus.y} scale={unit}><Sail colors={colors} /></Placed>
    </>
  );
};

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  return (
    <>
      <Fill id="ship-deck" layer={layer} stops={[[0, colors.deckFar], [1, colors.deck]]} from={backdrop.horizon} />
      <FloorLines layer={layer} color={colors.plank} count={15} opacity={0.6} />
      <Rail {...layer} />
      <Mast {...layer} />
      <Placed x={width * 0.08} y={backdrop.horizon + 30 * unit} scale={unit * 0.8}><Barrel colors={colors} seed="ship-barrel-far" /></Placed>
    </>
  );
};

const Barrel: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <ChalkShape path="M -80 0 Q -100 -110 -70 -220 H 70 Q 100 -110 80 0 Z" fill={colors.barrel} chalk={{ seed, width: 5 }} />
    <path d="M -84 -170 H 84 M -92 -50 H 92" stroke={colors.hoop} strokeWidth={12} />
  </g>
);

// A barrel and a coil of rope.
const Cargo: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <Placed x={-10} y={40} scale={1.1}><Barrel colors={colors} seed="ship-barrel" /></Placed>
    <ellipse cx={150} cy={-40} rx={46} ry={22} fill="none" stroke={colors.rope} strokeWidth={16} />
    <ellipse cx={150} cy={-56} rx={32} ry={14} fill="none" stroke={colors.rope} strokeWidth={14} />
  </g>
);

const Front: FC<LayerProps> = (layer) => <CornerProps layer={layer}><Cargo colors={layer.colors} /></CornerProps>;

export const pirateShip: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
