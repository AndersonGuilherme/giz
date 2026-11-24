import type { FC } from 'react';
import { SkyLayout } from '../../../../domain/scenario/SkyLayout.ts';
import { AspectRatio } from '../../../../domain/values/AspectRatio.ts';
import { ChalkBox, ChalkDisc, ChalkShape, Fill, Glow, Placed, Ridge } from './parts.tsx';
import { CornerProps } from './sceneryParts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A desert by the river in ancient times, giz style: a big hazy pyramid behind the characters, two small ones, an
// obelisk with made-up signs, palm trees and dunes; chalk lines on the monuments. Generic archetypes, no real landmark.

const palette = {
  skyTop: '#3d8fb0',
  skyBottom: '#f6d9a0',
  sun: '#fff1c4',
  pyramid: '#e7bd78',
  pyramidShade: '#c99a58',
  block: '#b78a4c',
  farDunes: '#ebcb8f',
  dunes: '#dcad66',
  sand: '#e6bb78',
  sandNear: '#d29e5e',
  river: '#4fa3b5',
  stone: '#cfa56e',
  glyph: '#7a5232',
  trunk: '#8a5a3a',
  leaves: '#4f8a5b',
  leavesDark: '#3c6e48',
  jar: '#c4673f',
  foreground: '#5a3a26',
};

type Pyramid = Readonly<{ x: number; base: number; apex: number; seed: string }>;

const PyramidShape: FC<Readonly<{ pyramid: Pyramid; colors: Palette; unit: number }>> = ({ pyramid, colors, unit }) => {
  const { x, base, apex, seed } = pyramid;
  const half = (base - apex) * 0.78;
  const outline = `M ${x - half} ${base} L ${x} ${apex} L ${x + half} ${base} Z`;
  const rows = [0.25, 0.5, 0.75].map((share) => `M ${x - half * share} ${apex + (base - apex) * share} H ${x + half * share}`);
  return (
    <g>
      <path d={outline} fill={colors.pyramid} />
      <path d={`M ${x} ${apex} L ${x + half} ${base} L ${x + half * 0.25} ${base} Z`} fill={colors.pyramidShade} />
      <path d={rows.join(' ')} stroke={colors.block} strokeWidth={3 * unit} opacity={0.6} />
      <ChalkShape path={outline} chalk={{ seed, width: 4 * unit }} />
    </g>
  );
};

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, height, unit, backdrop } = layer;
  const sun = SkyLayout.moon(AspectRatio.ofSize(width, height));
  const base = backdrop.horizon - 10 * unit;
  return (
    <>
      <Fill id="egypt-sky" layer={layer} stops={[[0, colors.skyTop], [1, colors.skyBottom]]} to={backdrop.horizon} />
      <Glow id="egypt-sun-glow" x={sun.x} y={sun.y} radius={sun.radius * 3.2} color={colors.sun} opacity={0.6} />
      <ChalkDisc x={sun.x} y={sun.y} radius={sun.radius * 0.8} fill={colors.sun} chalk={{ seed: 'egypt-sun', width: 4 * unit }} />
      <PyramidShape pyramid={{ x: width * 0.14, base, apex: base - 190 * unit, seed: 'egypt-small-left' }} colors={colors} unit={unit} />
      <PyramidShape pyramid={{ x: width * 0.86, base, apex: base - 240 * unit, seed: 'egypt-small-right' }} colors={colors} unit={unit} />
      <PyramidShape pyramid={{ x: backdrop.focus.x, base, apex: backdrop.focus.y - 60 * unit, seed: 'egypt-great' }} colors={colors} unit={unit} />
      <Ridge base={backdrop.horizon + 20 * unit} fill={colors.farDunes} chalk={{ seed: 'egypt-far-dunes', width: 3.5 * unit }} points={[[-width * 0.1, base - 30 * unit], [width * 0.3, base + 6 * unit], [width * 0.6, base - 24 * unit], [width * 1.1, base + 4 * unit]]} />
    </>
  );
};

// An obelisk with original signs: a sun disc, waves, an eye-less bird outline and dots.
const Obelisk: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -40 0 L -30 -440 L 0 -480 L 30 -440 L 40 0 Z" fill={colors.stone} chalk={{ seed: 'egypt-obelisk', width: 5 }} />
    <g stroke={colors.glyph} strokeWidth={6} fill="none" strokeLinecap="round">
      <circle cx={0} cy={-380} r={14} />
      <path d="M -16 -320 Q -8 -330 0 -320 Q 8 -310 16 -320 M -16 -300 Q -8 -310 0 -300 Q 8 -290 16 -300" />
      <path d="M -14 -230 Q 0 -260 14 -240 L 6 -220 M -10 -170 H 10 M -10 -150 H 10 M 0 -110 V -70" />
    </g>
  </g>
);

const Palm: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <path d="M -10 0 Q 0 -200 30 -400 L 46 -398 Q 18 -200 14 0 Z" fill={colors.trunk} />
    {[-150, -100, -40, 30, 90, 140].map((angle) => (
      <path key={angle} d="M 0 0 Q 60 -70 160 4 Q 110 -14 80 -6 Q 40 2 0 0 Z" fill={angle % 20 ? colors.leaves : colors.leavesDark} transform={`translate(38 -400) rotate(${angle})`} />
    ))}
    <ChalkDisc x={38} y={-400} radius={22} fill={colors.leavesDark} chalk={{ seed, width: 4 }} />
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon } = backdrop;
  return (
    <>
      <Fill id="egypt-sand" layer={layer} stops={[[0, colors.sand], [1, colors.sandNear]]} from={horizon} />
      <path d={`M ${width * 0.55} ${horizon + 6 * unit} Q ${width * 0.75} ${horizon + 20 * unit} ${width * 1.1} ${horizon + 14 * unit} V ${horizon + 34 * unit} Q ${width * 0.75} ${horizon + 40 * unit} ${width * 0.5} ${horizon + 12 * unit} Z`} fill={colors.river} opacity={0.8} />
      <Placed x={width * 0.07} y={horizon + 30 * unit} scale={unit * 0.9}><Obelisk colors={colors} /></Placed>
      <Placed x={width * 0.9} y={horizon + 24 * unit} scale={unit}><Palm colors={colors} seed="egypt-palm-near" /></Placed>
      <Placed x={width * 0.97} y={horizon + 8 * unit} scale={unit * 0.7}><Palm colors={colors} seed="egypt-palm-far" /></Placed>
    </>
  );
};

// A clay jar on a sandstone block.
const Jar: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkBox x={-220} y={-170} width={330} height={240} corner={10} fill={colors.foreground} chalk={{ seed: 'egypt-block', width: 5 }} />
    <ChalkShape path="M 10 -170 Q -40 -230 -10 -300 L -20 -330 L 60 -330 L 50 -300 Q 80 -230 30 -170 Z" fill={colors.jar} chalk={{ seed: 'egypt-jar', width: 5 }} />
    <path d="M -14 -270 H 64" stroke={colors.foreground} strokeWidth={8} />
  </g>
);

const Front: FC<LayerProps> = (layer) => <CornerProps layer={layer}><Jar colors={layer.colors} /></CornerProps>;

export const ancientEgypt: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
