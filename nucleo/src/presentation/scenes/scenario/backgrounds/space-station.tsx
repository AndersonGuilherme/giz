import type { FC } from 'react';
import { ChalkBox, ChalkDisc, ChalkShape, Fill, Glow, Placed, Stars } from './parts.tsx';
import { CornerProps, FloorLines, FloorRows, spread } from './sceneryParts.tsx';
import type { ColorsOf, LayerProps, VectorBackgroundModel } from './VectorBackgroundModel.ts';

type Colors = ColorsOf<'space-station'>;

// Inside a space station, giz style: a round window on a ringed planet behind the characters, wall panels with light
// strips, consoles with screens on the sides, a grid floor and cargo crates; chalk lines on the hull.

// The porthole: space with stars, a nebula and a ringed planet, inside a thick rim, 150 units in radius.
const Porthole: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g>
    <defs><clipPath id="station-glass"><circle cx={0} cy={0} r={130} /></clipPath></defs>
    <circle cx={0} cy={0} r={150} fill={colors.rim} />
    <circle cx={0} cy={0} r={130} fill={colors.space} />
    <g clipPath="url(#station-glass)">
      <ellipse cx={-50} cy={-60} rx={120} ry={50} fill={colors.nebula} opacity={0.5} style={{ filter: 'blur(14px)' }} />
      <g transform="translate(-130 -130)"><Stars color={colors.star} width={260} height={260} unit={1.6} /></g>
      <circle cx={30} cy={30} r={58} fill={colors.planet} />
      <path d="M 30 -28 A 58 58 0 0 1 30 88 A 40 58 0 0 0 30 -28 Z" fill={colors.planetShade} />
      <ellipse cx={30} cy={30} rx={100} ry={22} fill="none" stroke={colors.ring} strokeWidth={8} transform="rotate(-16 30 30)" />
    </g>
    <ChalkDisc x={0} y={0} radius={150} chalk={{ seed: 'station-rim', width: 5 }} />
    {spread(8, 0, 315).map((angle) => <circle key={angle} cx={140 * Math.cos((angle * Math.PI) / 180)} cy={140 * Math.sin((angle * Math.PI) / 180)} r={5} fill={colors.seam} />)}
  </g>
);

const Back: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  const columns = spread(9, -0.1, 1.1).map((at) => `M ${width * at} ${-layer.height * 0.1} V ${horizon}`);
  return (
    <>
      <Fill id="station-wall" layer={layer} stops={[[0, colors.hullTop], [0.5, colors.hull], [1, colors.panel]]} to={horizon} />
      <path d={columns.join(' ')} stroke={colors.seam} strokeWidth={8 * unit} />
      <rect x={-width * 0.1} y={horizon - 90 * unit} width={width * 1.2} height={10 * unit} fill={colors.strip} opacity={0.8} />
      <rect x={-width * 0.1} y={focus.y - 210 * unit} width={width * 1.2} height={10 * unit} fill={colors.strip} opacity={0.8} />
      <Glow id="station-porthole-glow" x={focus.x} y={focus.y} radius={240 * unit} color={colors.strip} opacity={0.25} />
      <Placed x={focus.x} y={focus.y} scale={unit}><Porthole colors={colors} /></Placed>
    </>
  );
};

// A console from the frame's edge inward: a slanted desk with two screens and a row of buttons.
const Console: FC<Readonly<{ colors: Colors; seed: string }>> = ({ colors, seed }) => (
  <g>
    <ChalkShape path="M -160 0 V -150 L 200 -170 L 230 0 Z" fill={colors.console} chalk={{ seed, width: 5 }} />
    <ChalkBox x={-120} y={-400} width={150} height={110} corner={10} fill={colors.console} chalk={{ seed: `${seed}-screen1`, width: 4 }} />
    <rect x={-106} y={-386} width={122} height={82} rx={6} fill={colors.screen} opacity={0.8} />
    <path d="M -96 -330 L -66 -360 L -36 -340 L 0 -376" stroke={colors.console} strokeWidth={6} fill="none" />
    <ChalkBox x={60} y={-360} width={120} height={90} corner={10} fill={colors.console} chalk={{ seed: `${seed}-screen2`, width: 4 }} />
    <rect x={72} y={-348} width={96} height={66} rx={6} fill={colors.screen2} opacity={0.75} />
    {spread(5, -110, 170).map((x, index) => <circle key={x} cx={x} cy={-140} r={10} fill={index % 2 ? colors.button : colors.screen} />)}
    <path d="M -40 -290 V -170 M 120 -270 V -170" stroke={colors.console} strokeWidth={12} />
  </g>
);

const Middle: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  return (
    <>
      <Fill id="station-floor" layer={layer} stops={[[0, colors.floorFar], [1, colors.floor]]} from={backdrop.horizon} />
      <FloorLines layer={layer} color={colors.grid} count={13} opacity={0.4} />
      <FloorRows layer={layer} color={colors.grid} count={7} opacity={0.4} />
      <Placed x={-width * 0.02} y={backdrop.horizon + 40 * unit} scale={unit * 0.8}><Console colors={colors} seed="station-console-left" /></Placed>
      <Placed x={width * 1.02} y={backdrop.horizon + 40 * unit} scale={unit * 0.8} flip><Console colors={colors} seed="station-console-right" /></Placed>
    </>
  );
};

// Two stacked cargo crates with hazard stripes.
const Crates: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g>
    <ChalkBox x={-200} y={-200} width={300} height={260} corner={10} fill={colors.crate} chalk={{ seed: 'station-crate', width: 5 }} />
    <path d={spread(6, -190, 60).map((x) => `M ${x} -190 l 30 0 l -30 40 l -30 0 Z`).join(' ')} fill={colors.hazard} />
    <ChalkBox x={-160} y={-360} width={220} height={160} corner={10} fill={colors.crate} chalk={{ seed: 'station-crate-top', width: 5 }} />
    <rect x={-120} y={-310} width={140} height={20} rx={10} fill={colors.screen} opacity={0.8} />
  </g>
);

const Front: FC<LayerProps<Colors>> = (layer) => <CornerProps layer={layer}><Crates colors={layer.colors} /></CornerProps>;

export const spaceStation: VectorBackgroundModel<Colors> = { layers: [Back, Middle, Front] };
