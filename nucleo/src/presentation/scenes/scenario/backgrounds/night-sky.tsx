import type { FC } from 'react';
import { Fill, Glow, Grass, Placed, Ridge, Stars } from './parts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A starry night on a hill: deep blue sky, the milky way, a big moon, dark hills with pines and a lit cabin.

const palette = {
  skyTop: '#0a1030',
  skyBottom: '#2a3a6e',
  milkyWay: '#9fb4ff',
  star: '#f3f0ff',
  moon: '#f6efd2',
  moonGlow: '#9fb4ff',
  farHills: '#1d2850',
  hills: '#141c3a',
  pine: '#0e1530',
  cabin: '#1a1630',
  window: '#ffcf7a',
  grass: '#0a0f22',
};

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, ground, unit } = layer;
  return (
    <>
      <Fill id="night-sky" layer={layer} stops={[[0, colors.skyTop], [1, colors.skyBottom]]} to={ground} />
      <ellipse cx={width * 0.5} cy={ground * 0.4} rx={width * 0.7} ry={70 * unit} fill={colors.milkyWay} opacity={0.18} transform={`rotate(-18 ${width * 0.5} ${ground * 0.4})`} style={{ filter: 'blur(24px)' }} />
      <Stars color={colors.star} width={width} height={ground * 0.85} unit={unit * 1.2} />
      <g transform={`translate(${width * 0.37} ${ground * 0.12})`}><Stars color={colors.star} width={width * 0.6} height={ground * 0.5} unit={unit * 0.8} /></g>
      <Glow id="night-moon-glow" x={width * 0.75} y={ground * 0.3} radius={300 * unit} color={colors.moonGlow} opacity={0.45} />
      <circle cx={width * 0.75} cy={ground * 0.3} r={80 * unit} fill={colors.moon} />
      <circle cx={width * 0.75 - 22 * unit} cy={ground * 0.3 + 14 * unit} r={14 * unit} fill="#000000" opacity={0.06} />
      <Ridge base={ground + 100 * unit} fill={colors.farHills} points={[[-width * 0.1, ground - 220 * unit], [width * 0.3, ground - 330 * unit], [width * 0.65, ground - 230 * unit], [width * 1.1, ground - 300 * unit]]} />
    </>
  );
};

const Pine: FC<Readonly<{ color: string }>> = ({ color }) => (
  <g fill={color}>
    <rect x={-8} y={-40} width={16} height={40} />
    <path d="M 0 -300 L 60 -150 L 30 -150 L 80 -40 L -80 -40 L -30 -150 L -60 -150 Z" />
  </g>
);

const Cabin: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g fill={colors.cabin}>
    <rect x={-80} y={-90} width={160} height={90} />
    <path d="M -100 -88 L 0 -160 L 100 -88 Z" />
    <rect x={-40} y={-64} width={30} height={30} fill={colors.window} />
    <rect x={20} y={-64} width={30} height={30} fill={colors.window} />
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, height, ground, unit } = layer;
  return (
    <>
      <Ridge base={height * 1.1} fill={colors.hills} points={[[-width * 0.1, ground - 150 * unit], [width * 0.35, ground - 190 * unit], [width * 0.7, ground - 130 * unit], [width * 1.1, ground - 170 * unit]]} />
      <Glow id="night-cabin-glow" x={width * 0.66} y={ground - 200 * unit} radius={140 * unit} color={colors.window} opacity={0.4} />
      <Placed x={width * 0.66} y={ground - 150 * unit} scale={unit * 0.9}><Cabin colors={colors} /></Placed>
      {[0.08, 0.15, 0.86, 0.94].map((at, index) => (
        <Placed key={at} x={width * at} y={ground - 140 * unit} scale={unit * (0.9 + (index % 2) * 0.3)}><Pine color={colors.pine} /></Placed>
      ))}
    </>
  );
};

const Front: FC<LayerProps> = ({ colors, width, height, unit }) => {
  const bottom = height * 1.06;
  return (
    <>
      <Ridge base={bottom + 40 * unit} fill={colors.grass} points={[[-width * 0.1, bottom - 120 * unit], [width * 0.2, bottom - 30 * unit], [width * 0.8, bottom - 20 * unit], [width * 1.1, bottom - 110 * unit]]} />
      <Placed x={150 * unit} y={bottom - 90 * unit} scale={unit * 1.3}><Grass color={colors.grass} width={260} height={110} /></Placed>
      <Placed x={width - 150 * unit} y={bottom - 90 * unit} scale={unit * 1.3}><Grass color={colors.grass} width={240} height={100} /></Placed>
    </>
  );
};

export const nightSky: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
