import type { FC } from 'react';
import { EffectCenter } from '../../../../domain/scenario/EffectCenter.ts';
import { AspectRatio } from '../../../../domain/values/AspectRatio.ts';
import { ChalkShape, Fill, Placed, Ridge } from './parts.tsx';
import { CornerProps, spread } from './sceneryParts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// A cave at dusk, giz style: plum rock walls with ochre paintings, stalactites, an opening on an orange sky, a sandy
// floor and a stone fire pit right where the `fire` effect burns by default; chalk lines on the rocks.

const MOUTH = 'M -170 150 Q -175 -40 -80 -130 Q 0 -185 85 -125 Q 175 -45 165 150 Z';

const Opening: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <defs>
      <linearGradient id="cave-sky" x1={0} y1={0} x2={0} y2={1}>
        <stop offset={0} stopColor={colors.skyTop} />
        <stop offset={1} stopColor={colors.skyBottom} />
      </linearGradient>
      <clipPath id="cave-mouth"><path d={MOUTH} /></clipPath>
    </defs>
    <path d={MOUTH} fill="url(#cave-sky)" />
    <g clipPath="url(#cave-mouth)">
      <circle cx={40} cy={40} r={46} fill={colors.sun} />
      <path d="M -200 160 L -200 60 Q -90 10 0 70 Q 90 20 200 70 L 200 160 Z" fill={colors.hills} />
    </g>
    <ChalkShape path={MOUTH} chalk={{ seed: 'cave-mouth', width: 6 }} />
  </g>
);

// Original cave art: a round beast with stick legs and horns, a hand print and three tally lines.
const Painting: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g opacity={0.85} strokeLinecap="round" fill="none">
    <path d="M -70 0 Q -60 -50 0 -48 Q 60 -50 70 0 Q 40 14 0 12 Q -40 14 -70 0 Z" fill={colors.paint} />
    <path d="M -45 10 V 46 M -20 12 V 48 M 25 12 V 48 M 50 10 V 46 M 66 -16 Q 92 -40 82 -62" stroke={colors.paint} strokeWidth={8} />
    <circle cx={-110} cy={-90} r={20} fill={colors.paint2} opacity={0.7} />
    <path d="M -126 -104 L -134 -132 M -114 -110 L -116 -140 M -102 -108 L -96 -136 M -92 -98 L -80 -118" stroke={colors.paint2} strokeWidth={7} opacity={0.7} />
    <path d="M 100 -110 V -70 M 118 -110 V -70 M 136 -110 V -70" stroke={colors.paint2} strokeWidth={7} />
  </g>
);

const Stalactites: FC<LayerProps> = ({ colors, width, unit, height, backdrop }) => {
  const line = backdrop.focus.y - 240 * unit;
  const drops = spread(11, 0.02, 0.98).filter((at) => Math.abs(at - 0.5) > 0.1);
  const tips = drops.map((at, index) => `M ${width * at - 26 * unit} ${line} L ${width * at} ${line + (60 + (index % 3) * 45) * unit} L ${width * at + 26 * unit} ${line} Z`);
  const points = spread(9, -0.1, 1.1).map((at, index) => [width * at, line + ((index % 2) * 30 - 10) * unit] as const);
  return (
    <>
      <Ridge points={points} base={-height * 0.1} fill={colors.ceiling} chalk={{ seed: 'cave-ceiling', width: 4 * unit }} />
      <path d={tips.join(' ')} fill={colors.ceiling} />
    </>
  );
};

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, unit, backdrop } = layer;
  return (
    <>
      <Fill id="cave-wall" layer={layer} stops={[[0, colors.rockDark], [0.7, colors.rock], [1, colors.rockLight]]} to={backdrop.horizon} />
      <Placed x={backdrop.focus.x} y={backdrop.focus.y} scale={unit}><Opening colors={colors} /></Placed>
      <Placed x={width * 0.2} y={backdrop.horizon - 250 * unit} scale={unit}><Painting colors={colors} /></Placed>
      <Placed x={width * 0.8} y={backdrop.horizon - 300 * unit} scale={unit * 0.8} flip><Painting colors={colors} /></Placed>
      <Stalactites {...layer} />
    </>
  );
};

// The fire pit: a ring of stones around crossed logs, under the default center of the `fire` effect.
const FirePit: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <path d="M -90 -10 L 90 -40 M -90 -40 L 90 -10" stroke={colors.log} strokeWidth={26} strokeLinecap="round" />
    {spread(6, -110, 110).map((x, index) => (
      <ChalkShape key={x} path={`M ${x - 24} 10 Q ${x - 22} ${-14 - (index % 2) * 10} ${x} ${-18 - (index % 2) * 10} Q ${x + 22} -14 ${x + 24} 10 Z`} fill={index % 2 ? colors.stone : colors.rockLight} chalk={{ seed: `cave-stone${index}`, width: 4 }} />
    ))}
  </g>
);

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, height, unit, backdrop } = layer;
  const pit = EffectCenter.of({ type: 'fire' }, AspectRatio.ofSize(width, height));
  const rise = [120, 160, 80, 0];
  const side = (from: number, to: number) => spread(4, from, to).map((at, index) => [width * at, backdrop.horizon - rise[index]! * unit] as const);
  return (
    <>
      <Fill id="cave-floor" layer={layer} stops={[[0, colors.floorFar], [1, colors.floor]]} from={backdrop.horizon - 2 * unit} />
      <Ridge points={side(-0.1, 0.22)} base={backdrop.horizon + 4 * unit} fill={colors.rockDark} chalk={{ seed: 'cave-rocks-left', width: 4 * unit }} />
      <Ridge points={side(1.1, 0.78)} base={backdrop.horizon + 4 * unit} fill={colors.rockDark} chalk={{ seed: 'cave-rocks-right', width: 4 * unit }} />
      <Placed x={pit.x} y={pit.y + 30 * unit} scale={unit}><FirePit colors={colors} /></Placed>
    </>
  );
};

const Boulder: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <ChalkShape path="M 40 60 L 95 -360 L 150 60 Z" fill={colors.foreground} chalk={{ seed: 'cave-spike', width: 5 }} />
    <ChalkShape path="M -220 60 L -220 -250 Q -120 -330 -20 -240 Q 70 -190 120 -110 Q 165 -30 185 60 Z" fill={colors.foreground} chalk={{ seed: 'cave-boulder', width: 5 }} />
  </g>
);

const Front: FC<LayerProps> = (layer) => <CornerProps layer={layer}><Boulder colors={layer.colors} /></CornerProps>;

export const cave: VectorBackgroundModel = { layers: [Back, Middle, Front] };
