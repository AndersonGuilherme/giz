import type { FC } from 'react';
import { Fill, Glow, Grass, Placed, Ridge, Stars, Tree } from './parts.tsx';
import { BarrelAndSack, Chapel, Cottage, Fence, House, Ruts } from './villageParts.tsx';
import type { LayerProps, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A medieval village at dusk: warm sky, far hills with a chapel, timber houses with lit windows, a dirt square.

const palette = {
  skyTop: '#22183a',
  skyMiddle: '#7d3b52',
  horizon: '#f0a05a',
  sun: '#ffd994',
  star: '#fff1cf',
  cloud: '#c86a5a',
  mountains: '#6b4566',
  farHills: '#5a3446',
  farHouses: '#3f2536',
  hills: '#47293a',
  haze: '#f3a35f',
  wall: '#a87048',
  timber: '#3a2317',
  roof: '#8a6233',
  roofShade: '#5a3d1f',
  window: '#ffc66b',
  ground: '#4f321f',
  groundFar: '#86552f',
  road: '#8a5d35',
  trunk: '#3a2418',
  leaves: '#55522a',
  leavesShade: '#3a3719',
  barrel: '#7a4e2c',
  sack: '#a88a5c',
  foreground: '#1f130d',
  grass: '#2b2612',
};

const Sky: FC<LayerProps> = (layer) => {
  const { colors, width, height, ground, unit } = layer;
  const stops = [[0, colors.skyTop], [0.5, colors.skyMiddle], [1, colors.horizon]] as const;
  return (
    <>
      <Fill id="village-sky" layer={layer} stops={stops} to={ground - 140 * unit} />
      <Stars color={colors.star} width={width} height={ground * 0.55} unit={unit} />
      <circle cx={width * 0.86} cy={height * 0.13} r={34 * unit} fill={colors.star} opacity={0.9} />
      <circle cx={width * 0.86 + 14 * unit} cy={height * 0.13 - 8 * unit} r={30 * unit} fill={colors.skyTop} />
      <Glow id="village-sun-glow" x={width * 0.7} y={ground - 300 * unit} radius={560 * unit} color={colors.sun} opacity={0.8} />
      <circle cx={width * 0.7} cy={ground - 300 * unit} r={62 * unit} fill={colors.sun} />
      <ellipse cx={width * 0.25} cy={ground - 520 * unit} rx={260 * unit} ry={16 * unit} fill={colors.cloud} opacity={0.45} />
      <ellipse cx={width * 0.8} cy={ground - 640 * unit} rx={200 * unit} ry={12 * unit} fill={colors.cloud} opacity={0.35} />
    </>
  );
};

const Distance: FC<LayerProps> = ({ colors, width, ground, unit }) => (
  <>
    <Ridge base={ground} fill={colors.mountains} opacity={0.8} points={[[-width * 0.1, ground - 330 * unit], [width * 0.15, ground - 470 * unit], [width * 0.4, ground - 360 * unit], [width * 0.62, ground - 450 * unit], [width * 0.9, ground - 350 * unit], [width * 1.1, ground - 420 * unit]]} />
    <Ridge base={ground} fill={colors.farHills} points={[[-width * 0.1, ground - 240 * unit], [width * 0.25, ground - 360 * unit], [width * 0.55, ground - 250 * unit], [width * 0.85, ground - 330 * unit], [width * 1.1, ground - 260 * unit]]} />
    <Placed x={width * 0.24} y={ground - 330 * unit} scale={unit * 0.8}><Chapel colors={colors} /></Placed>
    <Placed x={width * 0.36} y={ground - 300 * unit} scale={unit * 0.6}><Cottage colors={colors} light /></Placed>
    <Placed x={width * 0.12} y={ground - 280 * unit} scale={unit * 0.55}><Cottage colors={colors} light={false} /></Placed>
    <Placed x={width * 0.88} y={ground - 315 * unit} scale={unit * 0.6}><Cottage colors={colors} light /></Placed>
    <Ridge base={ground} fill={colors.hills} points={[[-width * 0.1, ground - 170 * unit], [width * 0.4, ground - 215 * unit], [width * 0.75, ground - 160 * unit], [width * 1.1, ground - 205 * unit]]} />
  </>
);

const Back: FC<LayerProps> = (layer) => (
  <>
    <Sky {...layer} />
    <Distance {...layer} />
  </>
);

const HOUSES = [
  { at: 0.05, scale: 1.05, flip: false },
  { at: 0.3, scale: 0.85, flip: true },
  { at: 0.75, scale: 0.9, flip: false },
  { at: 0.98, scale: 1.1, flip: true },
] as const;

const Square: FC<LayerProps> = (layer) => {
  const { colors, width, height, ground, unit } = layer;
  const horizon = ground - 120 * unit;
  const stops = [[0, colors.groundFar], [0.3, colors.ground], [1, colors.ground]] as const;
  return (
    <>
      <Fill id="village-ground" layer={layer} stops={stops} from={horizon - 10 * unit} />
      <path d={`M ${width * 0.42} ${horizon} L ${width * 0.58} ${horizon} L ${width * 1.05} ${height * 1.1} L ${width * 0.02} ${height * 1.1} Z`} fill={colors.road} opacity={0.5} />
      <Ruts color={colors.ground} width={width} horizon={horizon} bottom={height * 1.1} />
      <rect x={-width * 0.1} y={horizon - 160 * unit} width={width * 1.2} height={170 * unit} fill="url(#village-haze)" />
    </>
  );
};

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, ground, unit } = layer;
  const horizon = ground - 120 * unit;
  return (
    <>
      <defs>
        <radialGradient id="village-window-glow"><stop offset={0} stopColor={colors.window} stopOpacity={0.55} /><stop offset={1} stopColor={colors.window} stopOpacity={0} /></radialGradient>
        <linearGradient id="village-haze" x1={0} y1={0} x2={0} y2={1}><stop offset={0} stopColor={colors.haze} stopOpacity={0} /><stop offset={1} stopColor={colors.haze} stopOpacity={0.35} /></linearGradient>
      </defs>
      <Placed x={width * 0.17} y={horizon} scale={unit}><Tree trunk={colors.trunk} leaves={colors.leaves} shade={colors.leavesShade} height={660} /></Placed>
      <Square {...layer} />
      {HOUSES.map(({ at, scale, flip }) => (
        <Placed key={at} x={width * at} y={horizon + 8 * unit} scale={unit * scale} flip={flip}><House colors={colors} /></Placed>
      ))}
      <Placed x={width * 0.5} y={horizon + 4 * unit} scale={unit * 0.9}><Fence color={colors.timber} width={220} /></Placed>
    </>
  );
};

const Front: FC<LayerProps> = ({ colors, width, height, unit }) => {
  const bottom = height * 1.06;
  return (
    <>
      <Ridge base={bottom + 40 * unit} fill={colors.foreground} points={[[-width * 0.1, bottom - 200 * unit], [width * 0.02, bottom - 210 * unit], [200 * unit, bottom - 170 * unit], [400 * unit, bottom - 40 * unit], [width * 0.5, bottom - 10 * unit], [width - 250 * unit, bottom - 30 * unit], [width * 1.1, bottom - 120 * unit]]} />
      <Placed x={115 * unit} y={bottom - 165 * unit} scale={unit}><BarrelAndSack colors={colors} /></Placed>
      <Placed x={220 * unit} y={bottom - 90 * unit} scale={unit}><Grass color={colors.grass} width={200} height={80} /></Placed>
      <Placed x={width - 90 * unit} y={bottom - 20 * unit} scale={unit}><Grass color={colors.grass} width={180} height={60} /></Placed>
    </>
  );
};

export const village: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
