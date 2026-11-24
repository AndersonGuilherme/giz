import type { FC } from 'react';
import { ChalkBox, ChalkShape, Fill, Placed } from './parts.tsx';
import { CornerProps, FloorRows, HangingLamp, spread } from './sceneryParts.tsx';
import type { ColorsOf, LayerProps, VectorBackgroundModel } from './VectorBackgroundModel.ts';

type Colors = ColorsOf<'office'>;

// A modern office, giz style: a wide window on a made-up skyline behind the characters, a board of sticky notes, desks
// with screens on the sides, pendant lamps and a carpet floor; chalk lines on the furniture.

// The window: glass, a skyline of plain towers and the mullions, `wide` × 300 units centered on (0, 0); the scene gives
// it the backdrop's focus width, so it stays between the characters in 16:9.
const Window: FC<Readonly<{ colors: Colors; wide: number }>> = ({ colors, wide }) => {
  const towers = spread(Math.max(3, Math.round(wide / 80)), -wide / 2 + 20, wide / 2 - 76).map((x, index) => `M ${x} 150 V ${60 - (index % 3) * 50 - (index % 2) * 30} h ${40 + (index % 2) * 16} V 150 Z`);
  return (
    <g>
      <defs>
        <linearGradient id="office-glass" x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={colors.glassTop} />
          <stop offset={1} stopColor={colors.glassBottom} />
        </linearGradient>
      </defs>
      <rect x={-wide / 2} y={-150} width={wide} height={300} fill="url(#office-glass)" />
      <path d={towers.join(' ')} fill={colors.city} />
      <path d={spread(5, -wide / 2, wide / 2).map((x) => `M ${x} -150 V 150`).join(' ')} stroke={colors.frame} strokeWidth={12} />
      <ChalkBox x={-wide / 2 - 8} y={-158} width={wide + 16} height={316} corner={6} chalk={{ seed: 'office-window', width: 5 }} />
    </g>
  );
};

const Notes: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g>
    <ChalkBox x={-90} y={-70} width={180} height={140} corner={6} fill={colors.board} chalk={{ seed: 'office-board', width: 4 }} />
    {[[-60, -40, colors.note1], [-6, -46, colors.note2], [46, -36, colors.note3], [-50, 12, colors.note2], [10, 16, colors.note1]].map(([x, y, color]) => (
      <rect key={`${x}${y}`} x={x as number} y={y as number} width={40} height={40} fill={color as string} transform={`rotate(${(x as number) % 7} ${x} ${y})`} />
    ))}
  </g>
);

const Back: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon, focus } = backdrop;
  return (
    <>
      <Fill id="office-wall" layer={layer} stops={[[0, colors.wallTop], [1, colors.wall]]} to={horizon} />
      <Placed x={focus.x} y={focus.y} scale={unit}><Window colors={colors} wide={backdrop.focusWidth / unit - 16} /></Placed>
      <Placed x={width * 0.88} y={horizon - 230 * unit} scale={unit * 0.8}><Notes colors={colors} /></Placed>
      {[0.08, 0.92].map((at) => <HangingLamp key={at} x={width * at} y={focus.y - 160 * unit} unit={unit} shade={colors.lamp} light={colors.light} seed={`office-lamp${at}`} />)}
    </>
  );
};

// A desk with a screen and a chair back, standing on (0, 0); the screen faces the inside of the frame.
const Desk: FC<Readonly<{ colors: Colors; seed: string }>> = ({ colors, seed }) => (
  <g>
    <path d="M -110 0 V -120 M 110 0 V -120" stroke={colors.deskLeg} strokeWidth={10} />
    <ChalkBox x={-130} y={-140} width={260} height={22} corner={4} fill={colors.desk} chalk={{ seed, width: 4 }} />
    <ChalkBox x={-60} y={-270} width={140} height={96} corner={8} fill={colors.screen} chalk={{ seed: `${seed}-screen`, width: 4 }} />
    <rect x={-48} y={-258} width={116} height={72} rx={4} fill={colors.screenLight} opacity={0.75} />
    <path d="M 10 -174 V -140" stroke={colors.deskLeg} strokeWidth={10} />
    <ChalkShape path="M -150 0 V -90 Q -150 -190 -100 -190 Q -60 -190 -60 -90 V 0 Z" fill={colors.chair} chalk={{ seed: `${seed}-chair`, width: 4 }} />
  </g>
);

const Middle: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  const { horizon } = backdrop;
  return (
    <>
      <Fill id="office-floor" layer={layer} stops={[[0, colors.floorFar], [1, colors.floor]]} from={horizon} />
      <FloorRows layer={layer} color={colors.seam} count={8} opacity={0.4} />
      <Placed x={width * 0.08} y={horizon + 40 * unit} scale={unit * 0.9}><Desk colors={colors} seed="office-desk-left" /></Placed>
      <Placed x={width * 0.92} y={horizon + 40 * unit} scale={unit * 0.9} flip><Desk colors={colors} seed="office-desk-right" /></Placed>
    </>
  );
};

// A tall leafy plant in a round pot.
const Plant: FC<Readonly<{ colors: Colors }>> = ({ colors }) => (
  <g>
    {[-50, -20, 10, 40, 70].map((angle, index) => (
      <path key={angle} d="M 0 0 Q 70 -60 40 -200 Q -30 -110 0 0 Z" fill={index % 2 ? colors.leaves : colors.leavesDark} transform={`translate(30 -170) rotate(${angle})`} />
    ))}
    <ChalkShape path="M -50 -170 H 110 Q 110 40 30 40 Q -50 40 -50 -170 Z" fill={colors.pot} chalk={{ seed: 'office-pot', width: 5 }} />
  </g>
);

const Front: FC<LayerProps<Colors>> = (layer) => <CornerProps layer={layer}><Plant colors={layer.colors} /></CornerProps>;

export const office: VectorBackgroundModel<Colors> = { layers: [Back, Middle, Front] };
