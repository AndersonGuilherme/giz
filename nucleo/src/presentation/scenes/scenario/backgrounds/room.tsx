import type { FC } from 'react';
import { Silhouette } from '../../../../domain/drawing/Silhouette.ts';
import { ChalkLine } from '../../../drawing/ChalkLine.tsx';
import { ChalkBox, ChalkShape, Fill, Glow, Placed } from './parts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A cozy room in the evening, giz style: sage wall with a night window, a shelf and a picture; wooden floor, a round
// rug and a lamp; chalk lines on the furniture.
// It is also the fallback when a scenario image does not load.

const palette = {
  wall: '#5f8a7e',
  wallShade: '#456a61',
  wainscot: '#33524c',
  trim: '#22393a',
  night: '#2b3a5c',
  moon: '#f3efe2',
  frame: '#22393a',
  picture: '#e8735a',
  book1: '#e8735a',
  book2: '#3d6fb0',
  book3: '#f2b134',
  floor: '#94694c',
  floorFar: '#a77b5a',
  plank: '#76523a',
  rug: '#6c4f7c',
  rugBorder: '#f2b134',
  lamp: '#ffd98a',
  wood: '#5b4033',
  leaves: '#8fae8b',
  foreground: '#1c2827',
};

const Window: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <rect x={-150} y={-230} width={300} height={260} rx={8} fill={colors.night} />
    <circle cx={70} cy={-160} r={26} fill={colors.moon} />
    <circle cx={-80} cy={-190} r={3} fill={colors.moon} />
    <circle cx={-20} cy={-120} r={2.5} fill={colors.moon} />
    <path d="M 0 -230 V 30 M -150 -100 H 150" stroke={colors.frame} strokeWidth={14} />
    <rect x={-150} y={-230} width={300} height={260} rx={8} fill="none" stroke={colors.frame} strokeWidth={18} />
    <ChalkBox x={-159} y={-239} width={318} height={278} corner={12} chalk={{ seed: 'room-window', width: 5 }} />
    <rect x={-175} y={30} width={350} height={22} rx={6} fill={colors.trim} />
  </g>
);

const Shelf: FC<Readonly<{ colors: Palette }>> = ({ colors }) => {
  const books = [[colors.book1, 70], [colors.book2, 86], [colors.book3, 62], [colors.book1, 78], [colors.book2, 70]] as const;
  return (
    <g>
      {books.map(([color, tall], index) => <rect key={index} x={-110 + index * 34} y={-tall} width={28} height={tall} rx={3} fill={color} />)}
      <circle cx={95} cy={-34} r={30} fill={colors.leaves} />
      <ChalkBox x={-130} y={0} width={260} height={16} corner={4} fill={colors.wood} chalk={{ seed: 'room-shelf', width: 4 }} />
    </g>
  );
};

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, ground, unit } = layer;
  const base = ground - 150 * unit;
  return (
    <>
      <Fill id="room-wall" layer={layer} stops={[[0, colors.wallShade], [0.6, colors.wall], [1, colors.wall]]} to={base} />
      <rect x={-width * 0.1} y={base - 190 * unit} width={width * 1.2} height={190 * unit} fill={colors.wainscot} />
      <rect x={-width * 0.1} y={base - 200 * unit} width={width * 1.2} height={14 * unit} fill={colors.trim} />
      <Placed x={width * 0.5} y={base - 420 * unit} scale={unit}><Window colors={colors} /></Placed>
      <Placed x={width * 0.14} y={base - 470 * unit} scale={unit}><Shelf colors={colors} /></Placed>
      <rect x={width * 0.8 - 80 * unit} y={base - 560 * unit} width={160 * unit} height={120 * unit} fill={colors.picture} stroke={colors.frame} strokeWidth={14 * unit} />
      <ChalkBox x={width * 0.8 - 88 * unit} y={base - 568 * unit} width={176 * unit} height={136 * unit} chalk={{ seed: 'room-picture', width: 4 * unit }} />
    </>
  );
};

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, height, ground, unit } = layer;
  const base = ground - 150 * unit;
  const planks = Array.from({ length: 13 }, (_empty, index) => (index - 6) / 6);
  return (
    <>
      <Fill id="room-floor" layer={layer} stops={[[0, colors.floorFar], [0.3, colors.floor], [1, colors.floor]]} from={base} />
      <path d={planks.map((lean) => `M ${width * (0.5 + lean * 0.35)} ${base} L ${width * (0.5 + lean * 1.2)} ${height * 1.1}`).join(' ')} stroke={colors.plank} strokeWidth={4 * unit} opacity={0.6} />
      <ellipse cx={width * 0.5} cy={ground + 10 * unit} rx={width * 0.36} ry={70 * unit} fill={colors.rug} />
      <ChalkLine outline={Silhouette.ellipse({ x: width * 0.5, y: ground + 10 * unit }, width * 0.36, 70 * unit)} seed="room-rug" width={4 * unit} />
      <ellipse cx={width * 0.5} cy={ground + 10 * unit} rx={width * 0.36 - 18 * unit} ry={56 * unit} fill="none" stroke={colors.rugBorder} strokeWidth={6 * unit} />
      <Glow id="room-lamp-glow" x={width * 0.9} y={base - 280 * unit} radius={420 * unit} color={colors.lamp} opacity={0.55} />
      <Placed x={width * 0.9} y={base + 40 * unit} scale={unit}><Lamp colors={colors} /></Placed>
    </>
  );
};

const Lamp: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkBox x={-60} y={-110} width={120} height={110} corner={8} fill={colors.wood} chalk={{ seed: 'room-table', width: 5 }} />
    <rect x={-6} y={-290} width={12} height={180} fill={colors.trim} />
    <ChalkShape path="M -60 -290 L -38 -370 L 38 -370 L 60 -290 Z" fill={colors.lamp} chalk={{ seed: 'room-lamp', width: 5 }} />
  </g>
);

const Front: FC<LayerProps> = ({ colors, width, height, unit }) => {
  const bottom = height * 1.06;
  return (
    <>
      <path d={`M ${-width * 0.1} ${bottom} L ${-width * 0.1} ${bottom - 260 * unit} Q ${120 * unit} ${bottom - 300 * unit} ${200 * unit} ${bottom - 180 * unit} L ${220 * unit} ${bottom} Z`} fill={colors.foreground} />
      <Placed x={width - 110 * unit} y={bottom - 60 * unit} scale={unit}>
        <path d="M 0 0 Q -80 -120 -40 -230 Q 0 -120 0 0 Q 30 -150 110 -210 Q 40 -100 0 0 Q -10 -180 30 -300 Q 20 -150 0 0 Z" fill={colors.foreground} />
      </Placed>
    </>
  );
};

export const room: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
