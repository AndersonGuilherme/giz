import type { FC } from 'react';
import { ChalkBox, ChalkShape, Fill, Glow, Placed, Stars } from './parts.tsx';
import { CornerProps, Moon, spread } from './sceneryParts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A city at night, giz style: stars and a chalk moon clear of the HUD, a skyline of lit towers with a tall antenna
// tower behind the characters, near buildings with a glowing shop window on each side, a sidewalk and street lamps.

const palette = {
  skyTop: '#141c33',
  skyBottom: '#3b4f7a',
  star: '#f3efe2',
  moon: '#f3efe2',
  moonGlow: '#a7c4e8',
  far: '#26365a',
  tower: '#2f4270',
  near: '#1e2a45',
  window: '#f6d38a',
  window2: '#8fd3e8',
  beacon: '#ff8c73',
  shop: '#ffd9a0',
  awning: '#e8735a',
  sidewalk: '#4a5268',
  curb: '#353c50',
  road: '#262c3d',
  stripe: '#f2b134',
  lamp: '#ffe3a0',
  post: '#151a26',
  bin: '#3d6f8a',
  foreground: '#0e121c',
};

// Far towers: [x as a fraction of the width, width and height in units].
const SKYLINE = [[0.03, 120, 300], [0.12, 90, 420], [0.2, 130, 260], [0.32, 100, 360], [0.62, 110, 330], [0.71, 140, 450], [0.82, 100, 290], [0.92, 130, 400]] as const;

// A grid of lit windows in a `wide` × `tall` tower (units), every third one dark.
const windowsOf = (wide: number, tall: number) =>
  spread(Math.floor(tall / 60), 30, tall - 50).flatMap((y, row) => spread(Math.max(1, Math.floor(wide / 40)), 16, wide - 30).map((x, column) =>
    (row + column * 2) % 3 ? `M ${x} ${-y} h 14 v 20 h -14 Z` : ''));

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  return (
    <>
      <Fill id="city-sky" layer={layer} stops={[[0, colors.skyTop], [1, colors.skyBottom]]} to={horizon} />
      <Stars color={colors.star} width={width} height={horizon * 0.6} unit={unit * 1.1} />
      <Moon layer={layer} color={colors.moon} glow={colors.moonGlow} seed="city-moon" />
      <Placed x={focus.x} y={horizon} scale={unit}><AntennaTower colors={colors} tall={horizon / unit - (focus.y / unit - 150)} /></Placed>
      {SKYLINE.map(([at, wide, tall]) => (
        <g key={at} transform={`translate(${width * at} ${horizon}) scale(${unit})`}>
          <ChalkBox x={0} y={-tall} width={wide} height={tall} fill={colors.far} chalk={{ seed: `city-far${at}`, width: 3.5 }} />
          <path d={windowsOf(wide, tall).join(' ')} fill={at > 0.5 ? colors.window2 : colors.window} opacity={0.7} />
        </g>
      ))}
    </>
  );
};

// The tall tower behind the characters: a slim shaft, a pod near the top, an antenna with a red beacon.
const AntennaTower: FC<Readonly<{ colors: Palette; tall: number }>> = ({ colors, tall }) => (
  <g>
    <ChalkShape path={`M -50 0 L -30 ${-tall + 120} H 30 L 50 0 Z`} fill={colors.tower} chalk={{ seed: 'city-tower', width: 4 }} />
    <ChalkShape path={`M -90 ${-tall + 150} Q 0 ${-tall + 190} 90 ${-tall + 150} L 70 ${-tall + 90} H -70 Z`} fill={colors.tower} chalk={{ seed: 'city-pod', width: 4 }} />
    <path d={`M -60 ${-tall + 130} H 60`} stroke={colors.window2} strokeWidth={10} opacity={0.8} />
    <path d={`M 0 ${-tall + 90} V ${-tall}`} stroke={colors.tower} strokeWidth={8} />
    <circle cx={0} cy={-tall} r={10} fill={colors.beacon} />
  </g>
);

// A near building from the frame's edge inward, with a lit shop window and an awning.
const Building: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <ChalkBox x={-200} y={-560} width={420} height={560} fill={colors.near} chalk={{ seed, width: 5 }} />
    <path d={windowsOf(380, 330).join(' ')} fill={colors.window} opacity={0.75} transform="translate(-180 -220)" />
    <ChalkBox x={-20} y={-180} width={200} height={150} corner={6} fill={colors.shop} chalk={{ seed: `${seed}-shop`, width: 4 }} />
    <path d={spread(5, -30, 150).map((x) => `M ${x} -210 h 40 l -10 40 h -40 Z`).join(' ')} fill={colors.awning} />
  </g>
);

const StreetLamp: FC<Readonly<{ colors: Palette; seed: string }>> = ({ colors, seed }) => (
  <g>
    <Glow id={seed} x={0} y={-430} radius={200} color={colors.lamp} opacity={0.5} />
    <path d="M 0 0 V -430" stroke={colors.post} strokeWidth={12} />
    <ellipse cx={0} cy={-430} rx={30} ry={14} fill={colors.lamp} />
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, height, unit, backdrop } = layer;
  const { horizon, ground } = backdrop;
  const dashes = spread(9, -0.05, 1.05).map((at) => `M ${width * at} ${ground + 70 * unit} h ${60 * unit}`);
  return (
    <>
      <Fill id="city-sidewalk" layer={layer} stops={[[0, colors.sidewalk], [1, colors.sidewalk]]} from={horizon} to={ground + 30 * unit} />
      <rect x={-width * 0.1} y={ground + 30 * unit} width={width * 1.2} height={height * 1.1 - ground} fill={colors.road} />
      <rect x={-width * 0.1} y={ground + 24 * unit} width={width * 1.2} height={12 * unit} fill={colors.curb} />
      <path d={dashes.join(' ')} stroke={colors.stripe} strokeWidth={8 * unit} />
      <Placed x={-width * 0.03} y={horizon + 10 * unit} scale={unit * 0.8}><Building colors={colors} seed="city-near-left" /></Placed>
      <Placed x={width * 1.03} y={horizon + 10 * unit} scale={unit * 0.8} flip><Building colors={colors} seed="city-near-right" /></Placed>
      {[0.24, 0.76].map((at) => <Placed key={at} x={width * at} y={horizon + 10 * unit} scale={unit}><StreetLamp colors={colors} seed={`city-lamp${at}`} /></Placed>)}
    </>
  );
};

// A trash bin with a lid.
const Bin: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -60 60 L -80 -220 H 140 L 120 60 Z" fill={colors.bin} chalk={{ seed: 'city-bin', width: 5 }} />
    <ChalkBox x={-100} y={-250} width={260} height={34} corner={14} fill={colors.foreground} chalk={{ seed: 'city-lid', width: 5 }} />
    <path d="M -20 -180 V 20 M 30 -180 V 20 M 80 -180 V 20" stroke={colors.foreground} strokeWidth={10} opacity={0.4} />
  </g>
);

const Front: FC<LayerProps> = (layer) => <CornerProps layer={layer}><Bin colors={layer.colors} /></CornerProps>;

export const cityNight: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
