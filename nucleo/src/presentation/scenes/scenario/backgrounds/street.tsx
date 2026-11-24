import type { FC } from 'react';
import { Fill, Glow, Placed } from './parts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A city street at dusk: a skyline with lit windows, shops with warm fronts, a sidewalk and street lamps.

const palette = {
  skyTop: '#1f2a4f',
  skyBottom: '#e8875f',
  skyline: '#3a3355',
  skylineNear: '#2b2540',
  window: '#ffd37a',
  shopWall: '#6d4c5e',
  shopWall2: '#4f5f74',
  awning: '#c4503f',
  awning2: '#3f8f7a',
  shopLight: '#ffcf86',
  sidewalk: '#7d6f78',
  curb: '#4a4250',
  asphalt: '#38323f',
  lamp: '#ffe3a0',
  post: '#1e1a24',
  foreground: '#15111a',
};

// Towers of the skyline: [x as a fraction of the width, width and height in units].
const TOWERS = [[0.02, 140, 420], [0.12, 110, 560], [0.22, 160, 380], [0.35, 120, 620], [0.47, 180, 450], [0.6, 130, 540], [0.72, 170, 400], [0.84, 120, 600], [0.94, 150, 470]] as const;

const Skyline: FC<LayerProps> = ({ colors, width, ground, unit }) => (
  <g fill={colors.skyline}>
    {TOWERS.map(([at, wide, tall]) => (
      <g key={at}>
        <rect x={width * at} y={ground - 150 * unit - tall * unit} width={wide * unit} height={tall * unit} />
        {[0.2, 0.45, 0.7].map((row) => (
          <rect key={row} x={width * at + wide * unit * 0.3} y={ground - 150 * unit - tall * unit * (1 - row)} width={14 * unit} height={18 * unit} fill={colors.window} opacity={0.7} />
        ))}
      </g>
    ))}
  </g>
);

const Back: FC<LayerProps> = (layer) => (
  <>
    <Fill id="street-sky" layer={layer} stops={[[0, layer.colors.skyTop], [1, layer.colors.skyBottom]]} to={layer.ground - 150 * layer.unit} />
    <Skyline {...layer} />
  </>
);

const Shop: FC<Readonly<{ colors: Palette; wall: string; awning: string }>> = ({ colors, wall, awning }) => (
  <g>
    <rect x={-170} y={-420} width={340} height={420} fill={wall} />
    {[-110, 0, 110].map((x) => <rect key={x} x={x - 30} y={-380} width={60} height={70} rx={4} fill={colors.window} opacity={0.85} />)}
    <rect x={-150} y={-170} width={300} height={170} fill={colors.shopLight} opacity={0.9} />
    <path d="M -175 -190 H 175 L 155 -150 H -155 Z" fill={awning} />
    <rect x={-30} y={-150} width={60} height={150} fill={colors.post} opacity={0.6} />
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, height, ground, unit } = layer;
  const curb = ground - 40 * unit;
  return (
    <>
      <Placed x={width * 0.16} y={curb - 90 * unit} scale={unit}><Shop colors={colors} wall={colors.shopWall} awning={colors.awning} /></Placed>
      <Placed x={width * 0.84} y={curb - 90 * unit} scale={unit}><Shop colors={colors} wall={colors.shopWall2} awning={colors.awning2} /></Placed>
      <rect x={-width * 0.1} y={curb - 90 * unit} width={width * 1.2} height={height} fill={colors.sidewalk} />
      <rect x={-width * 0.1} y={curb + 120 * unit} width={width * 1.2} height={18 * unit} fill={colors.curb} />
      <rect x={-width * 0.1} y={curb + 138 * unit} width={width * 1.2} height={height} fill={colors.asphalt} />
      <Glow id="street-lamp-glow" x={width * 0.5} y={curb - 560 * unit} radius={380 * unit} color={colors.lamp} opacity={0.6} />
      <Placed x={width * 0.5} y={curb - 90 * unit} scale={unit}><StreetLamp colors={colors} /></Placed>
    </>
  );
};

const StreetLamp: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <rect x={-9} y={-470} width={18} height={470} fill={colors.post} />
    <path d="M -34 -470 L -22 -520 L 22 -520 L 34 -470 Z" fill={colors.lamp} />
    <rect x={-40} y={-476} width={80} height={10} rx={4} fill={colors.post} />
  </g>
);

const Front: FC<LayerProps> = ({ colors, width, height, unit }) => {
  const bottom = height * 1.06;
  return (
    <>
      <rect x={-width * 0.1} y={bottom - 120 * unit} width={width * 1.2} height={200 * unit} fill={colors.foreground} opacity={0.7} />
      <Placed x={60 * unit} y={bottom - 120 * unit} scale={unit}>
        <path d="M -90 0 Q -100 -160 0 -190 Q 110 -170 100 0 Z" fill={colors.foreground} />
      </Placed>
      <Placed x={width - 70 * unit} y={bottom - 120 * unit} scale={unit}>
        <rect x={-14} y={-620} width={28} height={620} fill={colors.foreground} />
      </Placed>
    </>
  );
};

export const street: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
