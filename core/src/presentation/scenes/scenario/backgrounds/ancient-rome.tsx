import type { FC } from 'react';
import { FOCUS_RADIUS } from '../../../../domain/scenario/BackdropLayout.ts';
import { ChalkBox, ChalkShape, Fill, Placed, Ridge } from './parts.tsx';
import { CornerProps, FloorLines, spread } from './sceneryParts.tsx';
import type { ColorsOf, LayerProps, VectorBackgroundModel } from './VectorBackgroundModel.ts';

type Colors = ColorsOf<'ancient-rome'>;

// A forum at noon, Gizzy style: a small temple on a hill behind the characters, cypress trees, a colonnade on each side,
// a paved square with a water basin; chalk lines on the marble. A generic ancient square, no real building.

// A column `height` units tall standing on (0, 0): base, fluted shaft and capital.
const Column: FC<Readonly<{ colors: Colors; height: number; seed: string }>> = ({ colors, height, seed }) => (
  <g>
    <ChalkBox x={-30} y={-height + 30} width={60} height={height - 50} fill={colors.marble} chalk={{ seed, width: 4 }} />
    <path d={`M -12 ${-height + 36} V -26 M 12 ${-height + 36} V -26`} stroke={colors.marbleShade} strokeWidth={5} />
    <ChalkBox x={-44} y={-height} width={88} height={30} corner={6} fill={colors.marble} chalk={{ seed: `${seed}-top`, width: 4 }} />
    <ChalkBox x={-42} y={-22} width={84} height={22} fill={colors.marbleShade} chalk={{ seed: `${seed}-base`, width: 4 }} />
  </g>
);

// The temple is drawn 200 units to each side (its lower step) and scaled into the backdrop's focus radius.
const TEMPLE_HALF_WIDTH = 200;

const Temple: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -170 -150 L 0 -230 L 170 -150 Z" fill={colors.roof} chalk={{ seed: 'rome-pediment', width: 5 }} />
    <ChalkBox x={-160} y={-150} width={320} height={24} fill={colors.marble} chalk={{ seed: 'rome-frieze', width: 4 }} />
    {spread(5, -128, 128).map((x) => <Placed key={x} x={x} y={80} scale={0.9}><Column colors={colors} height={225} seed={`rome-temple${x}`} /></Placed>)}
    <ChalkBox x={-180} y={80} width={360} height={22} fill={colors.marbleShade} chalk={{ seed: 'rome-step1', width: 4 }} />
    <ChalkBox x={-200} y={102} width={400} height={24} fill={colors.marble} chalk={{ seed: 'rome-step2', width: 4 }} />
  </g>
);

const Cypress: FC<Readonly<{ color: string }>> = ({ color }) => <path d="M 0 -180 Q 30 -100 22 0 L -22 0 Q -30 -100 0 -180 Z" fill={color} />;

const Back: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  const top = focus.y + 126 * unit;
  return (
    <>
      <Fill id="rome-sky" layer={layer} stops={[[0, colors.skyTop], [1, colors.skyBottom]]} to={horizon} />
      {[[0.3, 0.16], [0.7, 0.1]].map(([at, y]) => <ellipse key={at} cx={width * at!} cy={horizon * y!} rx={110 * unit} ry={26 * unit} fill={colors.cloud} opacity={0.8} />)}
      <Ridge base={horizon + 10 * unit} fill={colors.hillsFar} points={[[-width * 0.1, horizon - 140 * unit], [width * 0.25, horizon - 210 * unit], [width * 0.5, horizon - 120 * unit], [width * 0.8, horizon - 230 * unit], [width * 1.1, horizon - 150 * unit]]} />
      <Ridge base={horizon + 10 * unit} fill={colors.hills} chalk={{ seed: 'rome-hill', width: 4 * unit }} points={[[-width * 0.1, horizon - 40 * unit], [focus.x - 330 * unit, top + 40 * unit], [focus.x, top + 10 * unit], [focus.x + 330 * unit, top + 40 * unit], [width * 1.1, horizon - 40 * unit]]} />
      {[-260, -200, 210, 270].map((offset) => <Placed key={offset} x={focus.x + offset * unit} y={top + 60 * unit} scale={unit * 0.8}><Cypress color={colors.cypress} /></Placed>)}
      <Placed x={focus.x} y={top - 83 * unit} scale={(unit * FOCUS_RADIUS) / TEMPLE_HALF_WIDTH}><Temple colors={colors} /></Placed>
    </>
  );
};

// One side of the colonnade: columns under a beam, from the frame's edge inward.
const Colonnade: FC<Readonly<{ colors: Colors; seed: string }>> = ({ colors, seed }) => (
  <g>
    {[0, 150, 300].map((x) => <Placed key={x} x={x} y={0} scale={1}><Column colors={colors} height={560} seed={`${seed}${x}`} /></Placed>)}
    <ChalkBox x={-120} y={-620} width={470} height={60} fill={colors.marble} chalk={{ seed: `${seed}-beam`, width: 5 }} />
    <rect x={-120} y={-560} width={470} height={10} fill={colors.marbleShade} />
  </g>
);

const Middle: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon } = backdrop;
  return (
    <>
      <Fill id="rome-floor" layer={layer} stops={[[0, colors.floorFar], [1, colors.floor]]} from={horizon} />
      <FloorLines layer={layer} color={colors.paving} count={11} opacity={0.45} />
      <Placed x={width * 0.03} y={horizon + 20 * unit} scale={unit * 0.8}><Colonnade colors={colors} seed="rome-left" /></Placed>
      <Placed x={width * 0.97} y={horizon + 20 * unit} scale={unit * 0.8} flip><Colonnade colors={colors} seed="rome-right" /></Placed>
      <ChalkShape path={`M ${width * 0.5 - 160 * unit} ${horizon + 24 * unit} Q ${width * 0.5} ${horizon + 60 * unit} ${width * 0.5 + 160 * unit} ${horizon + 24 * unit} Q ${width * 0.5} ${horizon - 4 * unit} ${width * 0.5 - 160 * unit} ${horizon + 24 * unit} Z`} fill={colors.water} chalk={{ seed: 'rome-basin', width: 4 * unit }} />
    </>
  );
};

// A broken column stump beside an amphora.
const Ruin: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -200 60 L -200 -260 L -150 -240 L -110 -280 L -60 -250 L -40 60 Z" fill={colors.foreground} chalk={{ seed: 'rome-stump', width: 5 }} />
    <ChalkShape path="M 40 0 Q -10 -60 20 -150 L 10 -190 L 90 -190 L 80 -150 Q 110 -60 60 0 Z" fill={colors.banner} chalk={{ seed: 'rome-amphora', width: 5 }} />
    <path d="M 14 -170 Q -14 -150 16 -120 M 86 -170 Q 114 -150 84 -120" stroke={colors.banner} strokeWidth={10} fill="none" />
  </g>
);

const Front: FC<LayerProps<Colors>> = (layer) => <CornerProps layer={layer}><Ruin colors={layer.colors} /></CornerProps>;

export const ancientRome: VectorBackgroundModel<Colors> = { layers: [Back, Middle, Front] };
