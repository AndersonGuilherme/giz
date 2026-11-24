import type { FC } from 'react';
import { ChalkBox, ChalkDisc, ChalkShape, Fill, Glow, Placed } from './parts.tsx';
import { CornerProps, FloorRows, spread } from './sceneryParts.tsx';
import type { ColorsOf, LayerProps, VectorBackgroundModel } from './VectorBackgroundModel.ts';

type Colors = ColorsOf<'victorian-street'>;

// A street of the 1800s at dusk, giz style: narrow row houses with bay windows and chimneys, a gable with a round
// clock behind the characters, gas lamps, a cobbled street; chalk lines on the houses. A made-up street.

// A house front `wide` × `tall` units standing on (0, 0): roof, chimney, two rows of windows, a door.
const House: FC<Readonly<{ colors: Colors; wall: string; wide: number; tall: number; seed: string }>> = ({ colors, wall, wide, tall, seed }) => (
  <g>
    <rect x={wide * 0.6} y={-tall - 70} width={34} height={70} fill={colors.roof} />
    <ChalkShape path={`M ${-wide / 2 - 10} ${-tall} L ${-wide / 2 + 30} ${-tall - 50} H ${wide / 2 - 30} L ${wide / 2 + 10} ${-tall} Z`} fill={colors.roof} chalk={{ seed: `${seed}-roof`, width: 4 }} />
    <ChalkBox x={-wide / 2} y={-tall} width={wide} height={tall} fill={wall} chalk={{ seed, width: 4 }} />
    {[0.25, 0.55].map((row) => [-0.25, 0.25].map((column) => (
      <ChalkBox key={`${row}${column}`} x={wide * column - 22} y={-tall * (1 - row) - 30} width={44} height={60} corner={20} fill={colors.window} chalk={{ seed: `${seed}${row}${column}`, width: 3 }} />
    )))}
    <rect x={-24} y={-110} width={48} height={110} rx={22} fill={colors.trim} />
  </g>
);

const Gable: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -150 150 V -40 L 0 -160 L 150 -40 V 150 Z" fill={colors.house2} chalk={{ seed: 'victorian-gable', width: 5 }} />
    <ChalkDisc x={0} y={-30} radius={70} fill={colors.clock} chalk={{ seed: 'victorian-clock', width: 5 }} />
    <path d="M 0 -30 V -84 M 0 -30 L 36 -10" stroke={colors.hands} strokeWidth={8} strokeLinecap="round" />
    {spread(12, 0, 330).map((angle) => <circle key={angle} cx={58 * Math.sin((angle * Math.PI) / 180)} cy={-30 - 58 * Math.cos((angle * Math.PI) / 180)} r={4} fill={colors.hands} />)}
    <ChalkBox x={-60} y={70} width={120} height={80} corner={40} fill={colors.window} chalk={{ seed: 'victorian-arch', width: 4 }} />
  </g>
);

const Back: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  const base = horizon - 40 * unit;
  const houses = [[0.06, colors.house, 260, 440], [0.24, colors.house3, 220, 380], [0.76, colors.house3, 230, 420], [0.94, colors.house, 250, 470]] as const;
  return (
    <>
      <Fill id="victorian-sky" layer={layer} stops={[[0, colors.skyTop], [1, colors.skyBottom]]} to={horizon} />
      <rect x={focus.x - 150 * unit} y={focus.y + 150 * unit} width={300 * unit} height={base - focus.y - 150 * unit} fill={colors.house2} />
      <Placed x={focus.x} y={focus.y} scale={unit}><Gable colors={colors} /></Placed>
      {houses.map(([at, wall, wide, tall]) => (
        <Placed key={at} x={width * at} y={base} scale={unit}><House colors={colors} wall={wall} wide={wide} tall={tall} seed={`victorian-house${at}`} /></Placed>
      ))}
    </>
  );
};

const GasLamp: FC<Readonly<{ colors: Colors; seed: string }>> = ({ colors, seed }) => (
  <g>
    <path d="M -24 0 H 24 L 10 -30 V -430 H -10 V -30 Z" fill={colors.post} />
    <ChalkShape path="M -34 -430 L -24 -500 H 24 L 34 -430 Z" fill={colors.lamp} chalk={{ seed, width: 4 }} />
    <path d="M -40 -500 H 40 L 0 -530 Z" fill={colors.post} />
  </g>
);

const Middle: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon } = backdrop;
  return (
    <>
      <rect x={-width * 0.1} y={horizon - 40 * unit} width={width * 1.2} height={50 * unit} fill={colors.sidewalk} />
      <Fill id="victorian-street" layer={layer} stops={[[0, colors.cobbleFar], [1, colors.cobble]]} from={horizon + 10 * unit} />
      <FloorRows layer={layer} color={colors.joint} count={9} opacity={0.55} />
      {[0.14, 0.86].map((at) => (
        <g key={at}>
          <Glow id={`victorian-glow${at}`} x={width * at} y={horizon - 470 * unit} radius={200 * unit} color={colors.lamp} opacity={0.6} />
          <Placed x={width * at} y={horizon} scale={unit}><GasLamp colors={colors} seed={`victorian-lamp${at}`} /></Placed>
        </g>
      ))}
    </>
  );
};

// A wooden crate and a stone bollard.
const Crate: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g>
    <ChalkBox x={-160} y={-210} width={230} height={260} corner={6} fill={colors.crate} chalk={{ seed: 'victorian-crate', width: 5 }} />
    <path d="M -160 -210 L 70 50 M -160 -80 H 70" stroke={colors.foreground} strokeWidth={10} opacity={0.5} />
    <ChalkShape path="M 110 60 V -120 Q 150 -160 190 -120 V 60 Z" fill={colors.foreground} chalk={{ seed: 'victorian-bollard', width: 5 }} />
  </g>
);

const Front: FC<LayerProps<Colors>> = (layer) => <CornerProps layer={layer}><Crate colors={layer.colors} /></CornerProps>;

export const victorianStreet: VectorBackgroundModel<Colors> = { layers: [Back, Middle, Front] };
