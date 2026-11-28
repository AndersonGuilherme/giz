import type { FC } from 'react';
import { ChalkBox, ChalkDisc, Fill, Glow, Placed } from './parts.tsx';
import type { ColorsOf, LayerProps, VectorBackgroundModel } from './VectorBackgroundModel.ts';

type Colors = ColorsOf<'lab'>;

// A science lab, Gizzy style: lilac tiled wall, shelves of glowing flasks, a molecule poster, a bench with a microscope;
// chalk lines on the furniture and the glass.

const Flask: FC<Readonly<{ x: number; liquid: string; colors: Colors; tall?: number }>> = ({ x, liquid, colors, tall = 70 }) => (
  <g transform={`translate(${x} 0)`}>
    <circle cx={0} cy={-26} r={26} fill={colors.glass} opacity={0.5} />
    <circle cx={0} cy={-22} r={20} fill={liquid} />
    <ChalkDisc x={0} y={-26} radius={26} chalk={{ seed: `flask${x}${tall}`, width: 3.5 }} />
    <rect x={-7} y={-tall} width={14} height={tall - 40} fill={colors.glass} opacity={0.6} />
    <circle cx={0} cy={-26} r={36} fill={liquid} opacity={0.18} />
  </g>
);

const Shelf: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g>
    <Flask x={-90} liquid={colors.liquid1} colors={colors} />
    <Flask x={-20} liquid={colors.liquid2} colors={colors} tall={90} />
    <Flask x={50} liquid={colors.liquid3} colors={colors} />
    <Flask x={115} liquid={colors.liquid1} colors={colors} tall={80} />
    <ChalkBox x={-140} y={0} width={290} height={14} corner={3} fill={colors.shelf} chalk={{ seed: 'lab-shelf', width: 4 }} />
  </g>
);

const Poster: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g>
    <ChalkBox x={-90} y={-120} width={180} height={240} corner={6} fill={colors.poster} chalk={{ seed: 'lab-poster', width: 5 }} />
    <path d="M -30 -40 L 30 -10 L 0 50 M 30 -10 L 50 -70" fill="none" stroke={colors.ink} strokeWidth={6} />
    {[[-30, -40], [30, -10], [0, 50], [50, -70]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={14} fill={colors.liquid2} stroke={colors.ink} strokeWidth={4} />)}
  </g>
);

const Back: FC<LayerProps<Colors>> = (layer) => {
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

const Microscope: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g fill={colors.metal}>
    <rect x={-50} y={-14} width={100} height={14} rx={4} />
    <path d="M 20 -14 Q 40 -90 0 -130 L -14 -118 Q 20 -80 6 -14 Z" />
    <rect x={-30} y={-170} width={26} height={80} rx={6} transform="rotate(-20 -17 -130)" />
  </g>
);

const Middle: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, ground, unit } = layer;
  const base = ground - 150 * unit;
  return (
    <>
      <Fill id="lab-floor" layer={layer} stops={[[0, colors.floorFar], [1, colors.floor]]} from={base} />
      <ChalkBox x={width * 0.62} y={base - 160 * unit} width={width * 0.5} height={160 * unit} fill={colors.bench} chalk={{ seed: 'lab-bench', width: 4 * unit }} />
      <ChalkBox x={width * 0.6} y={base - 176 * unit} width={width * 0.52} height={20 * unit} corner={6 * unit} fill={colors.benchTop} chalk={{ seed: 'lab-top', width: 4 * unit }} />
      <Placed x={width * 0.72} y={base - 176 * unit} scale={unit}><Microscope colors={colors} /></Placed>
      <Placed x={width * 0.86} y={base - 176 * unit} scale={unit}><Flask x={0} liquid={colors.liquid3} colors={colors} tall={100} /></Placed>
    </>
  );
};

const Front: FC<LayerProps<Colors>> = ({ colors, width, height, unit }) => {
  const bottom = height * 1.06;
  return (
    <>
      <path d={`M ${-width * 0.1} ${bottom} V ${bottom - 220 * unit} H ${200 * unit} V ${bottom} Z`} fill={colors.foreground} />
      <Placed x={100 * unit} y={bottom - 220 * unit} scale={unit * 1.4}><Flask x={0} liquid={colors.liquid2} colors={colors} tall={110} /></Placed>
    </>
  );
};

export const lab: VectorBackgroundModel<Colors> = { layers: [Back, Middle, Front] };
