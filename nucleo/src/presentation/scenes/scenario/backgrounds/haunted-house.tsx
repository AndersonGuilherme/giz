import type { FC } from 'react';
import { ChalkBox, ChalkDisc, ChalkShape, Fill, Glow, Placed } from './parts.tsx';
import { CornerProps, FloorLines, spread } from './sceneryParts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// The hall of an old haunted house, spooky but cute, giz style: striped plum wallpaper, a tall arched window with the
// moon and curtains behind the characters, crooked portraits of a cat and of a round ghost, cobwebs, a grandfather
// clock, a candelabra and a dusty rug; chalk lines on the furniture. Nothing gory.

const palette = {
  wallTop: '#2f2640',
  wall: '#4a3f5e',
  stripe: '#55496b',
  trim: '#2a2236',
  night: '#2b3a5c',
  moon: '#f3efe2',
  curtain: '#7a3b5a',
  curtainShade: '#5e2c46',
  frame: '#b08a4a',
  portrait: '#6b5a7a',
  cat: '#1c1626',
  catEye: '#f2d16b',
  ghost: '#e9e6f2',
  web: '#d9d4e8',
  wood: '#4a3328',
  clockFace: '#efe6d2',
  candle: '#f3efe2',
  flame: '#ffd98a',
  floorFar: '#6b5242',
  floor: '#5b4537',
  plank: '#45342a',
  rug: '#6e3550',
  foreground: '#17121f',
};

const Window: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -100 150 V -60 Q -100 -160 0 -160 Q 100 -160 100 -60 V 150 Z" fill={colors.night} chalk={{ seed: 'haunted-window', width: 5 }} />
    <circle cx={34} cy={-70} r={34} fill={colors.moon} />
    <path d="M 0 -160 V 150 M -100 10 H 100" stroke={colors.trim} strokeWidth={12} />
    <path d="M -150 -170 Q -80 0 -130 160 H -90 Q -60 0 -100 -170 Z" fill={colors.curtain} />
    <path d="M 150 -170 Q 80 0 130 160 H 90 Q 60 0 100 -170 Z" fill={colors.curtainShade} />
    <rect x={-170} y={-186} width={340} height={20} rx={10} fill={colors.frame} />
  </g>
);

// A crooked portrait: a black cat with yellow eyes, or a round little ghost.
const Portrait: FC<Readonly<{ colors: Palette; ghost?: boolean; seed: string }>> = ({ colors, ghost, seed }) => (
  <g>
    <ChalkBox x={-70} y={-90} width={140} height={180} corner={12} fill={colors.frame} chalk={{ seed, width: 4 }} />
    <rect x={-54} y={-74} width={108} height={148} rx={8} fill={colors.portrait} />
    {ghost
      ? <path d="M -34 60 V -10 Q -34 -50 0 -50 Q 34 -50 34 -10 V 60 L 22 48 L 11 60 L 0 48 L -11 60 L -22 48 Z" fill={colors.ghost} />
      : <path d="M -40 74 Q -44 0 -30 -20 L -34 -50 L -14 -34 H 14 L 34 -50 L 30 -20 Q 44 0 40 74 Z" fill={colors.cat} />}
    <circle cx={-12} cy={ghost ? -14 : -10} r={6} fill={ghost ? colors.cat : colors.catEye} />
    <circle cx={12} cy={ghost ? -14 : -10} r={6} fill={ghost ? colors.cat : colors.catEye} />
  </g>
);

// A cobweb in a top corner: spokes and three sagging rings.
const Cobweb: FC<Readonly<{ color: string }>> = ({ color }) => {
  const spokes = spread(5, 0, 90).map((angle) => [Math.cos((angle * Math.PI) / 180), Math.sin((angle * Math.PI) / 180)] as const);
  const ring = (reach: number) => spokes.map(([x, y], index) => `${index ? 'Q' : 'M'} ${index ? `${x * reach * 0.7} ${y * reach * 0.7} ` : ''}${x * reach} ${y * reach}`).join(' ');
  return (
    <g fill="none" stroke={color} strokeWidth={3} opacity={0.6}>
      <path d={spokes.map(([x, y]) => `M 0 0 L ${x * 220} ${y * 220}`).join(' ')} />
      <path d={[70, 130, 190].map(ring).join(' ')} />
    </g>
  );
};

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  const stripes = spread(Math.round(width / (60 * unit)), -0.05, 1.05).map((at) => `M ${width * at} ${-layer.height * 0.1} V ${horizon}`);
  return (
    <>
      <Fill id="haunted-wall" layer={layer} stops={[[0, colors.wallTop], [1, colors.wall]]} to={horizon} />
      <path d={stripes.join(' ')} stroke={colors.stripe} strokeWidth={22 * unit} />
      <rect x={-width * 0.1} y={horizon - 110 * unit} width={width * 1.2} height={110 * unit} fill={colors.trim} />
      <Glow id="haunted-moonlight" x={focus.x} y={focus.y} radius={260 * unit} color={colors.moon} opacity={0.18} />
      <Placed x={focus.x} y={focus.y + 20 * unit} scale={unit}><Window colors={colors} /></Placed>
      <g transform={`translate(${width * 0.2} ${focus.y + 60 * unit}) rotate(-6) scale(${unit})`}><Portrait colors={colors} seed="haunted-cat" /></g>
      <g transform={`translate(${width * 0.8} ${focus.y + 40 * unit}) rotate(5) scale(${unit})`}><Portrait colors={colors} ghost seed="haunted-ghost" /></g>
      <Placed x={width * 1.04} y={-layer.height * 0.02} scale={unit} flip><Cobweb color={colors.web} /></Placed>
    </>
  );
};

const GrandfatherClock: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M -60 0 V -380 Q -60 -440 0 -440 Q 60 -440 60 -380 V 0 Z" fill={colors.wood} chalk={{ seed: 'haunted-clock', width: 5 }} />
    <ChalkDisc x={0} y={-370} radius={40} fill={colors.clockFace} chalk={{ seed: 'haunted-clock-face', width: 3.5 }} />
    <path d="M 0 -370 V -396 M 0 -370 L 16 -360 M 0 -300 V -120" stroke={colors.trim} strokeWidth={6} strokeLinecap="round" />
    <circle cx={0} cy={-110} r={18} fill={colors.frame} />
  </g>
);

const Candelabra: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <path d="M -40 0 H 40 L 6 -20 V -120 M -60 -150 Q -60 -110 0 -110 Q 60 -110 60 -150" stroke={colors.frame} strokeWidth={10} fill="none" />
    {[-60, 0, 60].map((x) => (
      <g key={x}>
        <rect x={x - 9} y={x ? -200 : -220} width={18} height={x ? 50 : 70} fill={colors.candle} />
        <path d={`M ${x} ${x ? -224 : -244} q 10 12 0 22 q -10 -10 0 -22 Z`} fill={colors.flame} />
      </g>
    ))}
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, ground } = backdrop;
  return (
    <>
      <Fill id="haunted-floor" layer={layer} stops={[[0, colors.floorFar], [1, colors.floor]]} from={horizon} />
      <FloorLines layer={layer} color={colors.plank} count={15} opacity={0.6} />
      <ellipse cx={width * 0.5} cy={ground + 6 * unit} rx={width * 0.34} ry={64 * unit} fill={colors.rug} opacity={0.85} />
      <Placed x={width * 0.07} y={horizon + 30 * unit} scale={unit}><GrandfatherClock colors={colors} /></Placed>
      <Glow id="haunted-candles" x={width * 0.92} y={horizon - 180 * unit} radius={200 * unit} color={colors.flame} opacity={0.45} />
      <ChalkBox x={width * 0.92 - 70 * unit} y={horizon - 60 * unit} width={140 * unit} height={90 * unit} corner={6 * unit} fill={colors.wood} chalk={{ seed: 'haunted-table', width: 4 * unit }} />
      <Placed x={width * 0.92} y={horizon - 60 * unit} scale={unit}><Candelabra colors={colors} /></Placed>
    </>
  );
};

// A tall candle on an iron stand, with a cobweb from the stand to the floor.
const CandleStand: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <path d="M 20 60 V -280 M -40 60 L 20 -40 L 80 60" stroke={colors.foreground} strokeWidth={18} fill="none" />
    <rect x={-10} y={-400} width={60} height={120} rx={8} fill={colors.candle} />
    <Glow id="haunted-near-flame" x={20} y={-430} radius={120} color={colors.flame} opacity={0.5} />
    <path d="M 20 -460 q 22 26 0 48 q -22 -22 0 -48 Z" fill={colors.flame} />
  </g>
);

const Front: FC<LayerProps> = (layer) => <CornerProps layer={layer}><CandleStand colors={layer.colors} /></CornerProps>;

export const hauntedHouse: VectorBackgroundModel = { palette, layers: [Back, Middle, Front] };
