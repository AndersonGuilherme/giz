import type { FC } from 'react';
import { ChalkBox, ChalkShape, Fill, Glow, Grass, Placed, Ridge, Tree } from './parts.tsx';
import type { LayerProps, Palette, VectorBackgroundModel } from './VectorBackgroundModel.ts';

// An open field on a warm afternoon, giz style: teal sky with chalk clouds, layered hills with chalk ridges, a meadow
// with a lone tree, a fence and flowers.

const Cloud: FC<Readonly<{ color: string; seed: string }>> = ({ color, seed }) => (
  <ChalkShape path="M -120 10 Q -140 -20 -92 -30 Q -80 -66 -36 -60 Q -8 -96 40 -80 Q 90 -86 96 -36 Q 136 -30 120 10 Z" fill={color} chalk={{ seed, width: 4 }} />
);

const Back: FC<LayerProps> = (layer) => {
  const { colors, width, ground, unit } = layer;
  return (
    <>
      <Fill id="field-sky" layer={layer} stops={[[0, colors.skyTop], [1, colors.skyBottom]]} to={ground - 150 * unit} />
      <Glow id="field-sun" x={width * 0.78} y={ground - 620 * unit} radius={360 * unit} color={colors.sun} opacity={0.9} />
      <Placed x={width * 0.22} y={ground - 640 * unit} scale={unit}><Cloud color={colors.cloud} seed="field-cloud1" /></Placed>
      <Placed x={width * 0.6} y={ground - 760 * unit} scale={unit * 0.8}><Cloud color={colors.cloud} seed="field-cloud2" /></Placed>
      <Ridge base={ground} fill={colors.farHills} chalk={{ seed: 'field-far', width: 4 * unit }} points={[[-width * 0.1, ground - 260 * unit], [width * 0.3, ground - 380 * unit], [width * 0.6, ground - 280 * unit], [width * 0.9, ground - 350 * unit], [width * 1.1, ground - 300 * unit]]} />
      <Ridge base={ground} fill={colors.hills} chalk={{ seed: 'field-hills', width: 4 * unit }} points={[[-width * 0.1, ground - 180 * unit], [width * 0.35, ground - 240 * unit], [width * 0.7, ground - 170 * unit], [width * 1.1, ground - 220 * unit]]} />
    </>
  );
};

const Flowers: FC<Readonly<{ colors: Palette; width: number; top: number; depth: number; unit: number }>> = ({ colors, width, top, depth, unit }) => {
  const spots = [[0.08, 0.3], [0.2, 0.7], [0.33, 0.45], [0.46, 0.9], [0.58, 0.35], [0.69, 0.75], [0.81, 0.5], [0.93, 0.85], [0.26, 0.15], [0.75, 0.2]] as const;
  const tones = [colors.flower1, colors.flower2, colors.flower3];
  return (
    <g>
      {spots.map(([x, down], index) => <circle key={index} cx={width * x} cy={top + depth * down} r={(4 + 6 * down) * unit} fill={tones[index % 3]} />)}
    </g>
  );
};

const Middle: FC<LayerProps> = (layer) => {
  const { colors, width, height, ground, unit } = layer;
  const horizon = ground - 150 * unit;
  return (
    <>
      <Placed x={width * 0.8} y={horizon + 10 * unit} scale={unit}><Tree trunk={colors.trunk} leaves={colors.leaves} shade={colors.leavesShade} height={560} seed="field-tree" /></Placed>
      <Fill id="field-meadow" layer={layer} stops={[[0, colors.meadow], [1, colors.meadowNear]]} from={horizon} />
      <path d={`M ${width * 0.46} ${horizon} Q ${width * 0.5} ${ground} ${width * 0.3} ${height * 1.1} L ${width * 0.62} ${height * 1.1} Q ${width * 0.56} ${ground} ${width * 0.5} ${horizon} Z`} fill={colors.path} opacity={0.7} />
      <Placed x={width * 0.04} y={horizon + 40 * unit} scale={unit * 0.8}><FieldFence color={colors.fence} /></Placed>
      <Flowers colors={colors} width={width} top={horizon + 20 * unit} depth={height - horizon} unit={unit} />
    </>
  );
};

const FieldFence: FC<Readonly<{ color: string }>> = ({ color }) => (
  <g fill={color}>
    {[0, 120, 240, 360].map((x) => <ChalkBox key={x} x={x - 8} y={-120} width={16} height={120} corner={3} fill={color} chalk={{ seed: `field-post${x}`, width: 4 }} />)}
    <rect x={0} y={-96} width={360} height={10} rx={4} />
    <rect x={0} y={-52} width={360} height={10} rx={4} />
  </g>
);

const Front: FC<LayerProps> = ({ colors, width, height, unit }) => {
  const bottom = height * 1.06;
  return (
    <>
      <Placed x={120 * unit} y={bottom - 50 * unit} scale={unit * 1.4}><Grass color={colors.grass} width={300} height={150} /></Placed>
      <Placed x={width - 120 * unit} y={bottom - 50 * unit} scale={unit * 1.4}><Grass color={colors.grass} width={280} height={130} /></Placed>
    </>
  );
};

export const field: VectorBackgroundModel = { layers: [Back, Middle, Front] };
