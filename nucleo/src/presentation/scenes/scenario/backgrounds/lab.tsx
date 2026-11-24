import type { FC } from 'react';
import { Fill, Glow, Placed } from './parts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A science lab: teal tiled wall, shelves of glowing flasks, a molecule poster, a bench with a microscope.

const palette = {
  wall: '#3f6e6a',
  wallShade: '#2a4a48',
  tile: '#4c7f7a',
  shelf: '#5a4634',
  glass: '#cfe8e6',
  liquid1: '#7ee08a',
  liquid2: '#5fc3ff',
  liquid3: '#ff8bd0',
  poster: '#e9e2cc',
  ink: '#2f3b3a',
  floor: '#596b6a',
  floorFar: '#6f8483',
  bench: '#2f3a3c',
  benchTop: '#d9d4c3',
  metal: '#8c9aa0',
  lamp: '#e8fff6',
  foreground: '#14201f',
};

const Flask: FC<Readonly<{ x: number; liquid: string; colors: Palette; tall?: number }>> = ({ x, liquid, colors, tall = 70 }) => (
  <g transform={`translate(${x} 0)`}>
    <circle cx={0} cy={-26} r={26} fill={colors.glass} opacity={0.5} />
    <circle cx={0} cy={-22} r={20} fill={liquid} />
    <rect x={-7} y={-tall} width={14} height={tall - 40} fill={colors.glass} opacity={0.6} />
    <circle cx={0} cy={-26} r={36} fill={liquid} opacity={0.18} />
  </g>
);

const Shelf: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <Flask x={-90} liquid={colors.liquid1} colors={colors} />
    <Flask x={-20} liquid={colors.liquid2} colors={colors} tall={90} />
    <Flask x={50} liquid={colors.liquid3} colors={colors} />
    <Flask x={115} liquid={colors.liquid1} colors={colors} tall={80} />
    <rect x={-140} y={0} width={290} height={14} rx={3} fill={colors.shelf} />
  </g>
);

const Poster: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <rect x={-90} y={-120} width={180} height={240} rx={6} fill={colors.poster} />
    <path d="M -30 -40 L 30 -10 L 0 50 M 30 -10 L 50 -70" stroke={colors.ink} strokeWidth={6} />
    {[[-30, -40], [30, -10], [0, 50], [50, -70]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={14} fill={colors.liquid2} stroke={colors.ink} strokeWidth={4} />)}
  </g>
);

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, ground, unit } = layer;
  const base = ground - 150 * unit;
  const columns = Array.from({ length: 24 }, (_empty, index) => index / 20 - 0.1);
  return (
    <>
      <Fill id="lab-wall" layer={layer} stops={[[0, colors.wallShade], [1, colors.wall]]} to={base} />
      <path d={columns.map((at) => `M ${width * at} ${-layer.height * 0.1} V ${base}`).join(' ')} stroke={colors.tile} strokeWidth={3 * unit} opacity={0.5} />
      <Placed x={width * 0.2} y={base - 420 * unit} scale={unit}><Shelf colors={colors} /></Placed>
      <Placed x={width * 0.2} y={base - 250 * unit} scale={unit}><Shelf colors={colors} /></Placed>
      <Placed x={width * 0.78} y={base - 400 * unit} scale={unit}><Poster colors={colors} /></Placed>
      <Glow id="lab-ceiling-light" x={width * 0.5} y={base - 700 * unit} radius={520 * unit} color={colors.lamp} opacity={0.35} />
    </>
  );
};

const Microscope: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g fill={colors.metal}>
    <rect x={-50} y={-14} width={100} height={14} rx={4} />
    <path d="M 20 -14 Q 40 -90 0 -130 L -14 -118 Q 20 -80 6 -14 Z" />
    <rect x={-30} y={-170} width={26} height={80} rx={6} transform="rotate(-20 -17 -130)" />
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, ground, unit } = layer;
  const base = ground - 150 * unit;
  return (
    <>
      <Fill id="lab-floor" layer={layer} stops={[[0, colors.floorFar], [1, colors.floor]]} from={base} />
      <rect x={width * 0.62} y={base - 160 * unit} width={width * 0.5} height={160 * unit} fill={colors.bench} />
      <rect x={width * 0.6} y={base - 176 * unit} width={width * 0.52} height={20 * unit} rx={6 * unit} fill={colors.benchTop} />
      <Placed x={width * 0.72} y={base - 176 * unit} scale={unit}><Microscope colors={colors} /></Placed>
      <Placed x={width * 0.86} y={base - 176 * unit} scale={unit}><Flask x={0} liquid={colors.liquid3} colors={colors} tall={100} /></Placed>
    </>
  );
};

const Front: FC<LayerProps> = ({ colors, width, height, unit }) => {
  const bottom = height * 1.06;
  return (
    <>
      <path d={`M ${-width * 0.1} ${bottom} V ${bottom - 220 * unit} H ${200 * unit} V ${bottom} Z`} fill={colors.foreground} />
      <Placed x={100 * unit} y={bottom - 220 * unit} scale={unit * 1.4}><Flask x={0} liquid={colors.liquid2} colors={colors} tall={110} /></Placed>
    </>
  );
};

export const lab: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
