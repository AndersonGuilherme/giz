import type { FC } from 'react';
import { ChalkDisc, ChalkShape, Fill, Glow, Grass, Placed, Ridge, Tree } from './parts.tsx';
import { Cloud, HillHouse, Stall, Tower, Well, Windmill } from './villageParts.tsx';
import type { ColorsOf, LayerProps, VectorBackgroundModel } from './VectorBackgroundModel.ts';

type Colors = ColorsOf<'village'>;

// A hill village in the morning, giz style: a teal sky with chalk clouds and the sun rising behind a cluster of
// white houses on the central hill, a windmill on the far left, a road winding up to the houses, a stone well on the
// left and a fruit stall on the right.

const Sky: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, ground, unit } = layer;
  const stops = [[0, colors.skyTop], [0.6, colors.skyMiddle], [1, colors.horizon]] as const;
  const sun = { x: width * 0.56, y: ground - 470 * unit };
  return (
    <>
      <Fill id="village-sky" layer={layer} stops={stops} to={ground - 140 * unit} />
      <Glow id="village-sun-glow" x={sun.x} y={sun.y} radius={420 * unit} color={colors.sun} opacity={0.7} />
      <ChalkDisc x={sun.x} y={sun.y} radius={80 * unit} fill={colors.sun} chalk={{ seed: 'village-sun', width: 5 * unit }} />
      <Placed x={width * 0.8} y={ground - 700 * unit} scale={unit}><Cloud colors={colors} seed="cloud-right" /></Placed>
      <Placed x={width * 0.24} y={ground - 610 * unit} scale={unit * 0.8}><Cloud colors={colors} seed="cloud-left" /></Placed>
    </>
  );
};

// The cluster on the central hill: [x from the hill center, lift, scale, roof color key].
const CLUSTER = [[-210, 40, 0.8, 'roof'], [-110, 70, 1, 'roof2'], [120, 66, 0.95, 'roof'], [220, 36, 0.8, 'roof2'], [10, 92, 1.1, 'roof']] as const;

const Hills: FC<LayerProps<Colors>> = ({ colors, width, ground, unit }) => {
  const hilltop = ground - 330 * unit;
  return (
    <>
      <Ridge base={ground} fill={colors.farHills} chalk={{ seed: 'village-far', width: 4 * unit }} points={[[-width * 0.1, ground - 300 * unit], [width * 0.12, ground - 420 * unit], [width * 0.3, ground - 300 * unit], [width * 0.75, ground - 280 * unit], [width * 1.1, ground - 360 * unit]]} />
      <Placed x={width * 0.12} y={ground - 380 * unit} scale={unit * 0.75}><Windmill colors={colors} seed="mill" /></Placed>
      <Ridge base={ground} fill={colors.hill} chalk={{ seed: 'village-hill', width: 4 * unit }} points={[[width * 0.18, ground - 150 * unit], [width * 0.38, ground - 300 * unit], [width * 0.5, ground - 350 * unit], [width * 0.62, ground - 300 * unit], [width * 0.82, ground - 150 * unit]]} />
      <Placed x={width * 0.5 + 40 * unit} y={hilltop + 30 * unit} scale={unit * 0.7}><Tower colors={colors} seed="tower" /></Placed>
      {CLUSTER.map(([x, lift, scale, roof]) => (
        <Placed key={x} x={width * 0.5 + x * unit} y={hilltop + lift * unit} scale={unit * scale * 0.7}>
          <HillHouse colors={colors} seed={`house${x}`} roof={colors[roof]!} />
        </Placed>
      ))}
    </>
  );
};

const Back: FC<LayerProps<Colors>> = (layer) => (
  <>
    <Sky {...layer} />
    <Hills {...layer} />
  </>
);

const Middle: FC<LayerProps<Colors>> = (layer) => {
  const { colors, width, height, ground, unit } = layer;
  const horizon = ground - 150 * unit;
  const road = `M ${width * 0.47} ${horizon} Q ${width * 0.56} ${horizon + 60 * unit} ${width * 0.5} ${ground - 40 * unit}`
    + ` Q ${width * 0.42} ${ground + 80 * unit} ${width * 0.7} ${height * 1.1} L ${width * 0.98} ${height * 1.1}`
    + ` Q ${width * 0.62} ${ground + 60 * unit} ${width * 0.6} ${ground - 50 * unit} Q ${width * 0.6} ${horizon + 50 * unit} ${width * 0.52} ${horizon} Z`;
  return (
    <>
      <Fill id="village-meadow" layer={layer} stops={[[0, colors.meadow], [1, colors.meadowNear]]} from={horizon} />
      <ChalkShape path={road} fill={colors.road} chalk={{ seed: 'village-road', width: 4 * unit }} />
      <Placed x={width * 0.92} y={horizon + 20 * unit} scale={unit * 0.9}><Tree trunk={colors.trunk} leaves={colors.leaves} shade={colors.leavesShade} height={520} seed="village-tree" /></Placed>
      <Placed x={width * 0.2} y={horizon + 40 * unit} scale={unit * 0.85}><Well colors={colors} seed="well" /></Placed>
      <Placed x={width * 0.8} y={horizon + 60 * unit} scale={unit * 0.85}><Stall colors={colors} seed="stall" /></Placed>
    </>
  );
};

const Front: FC<LayerProps<Colors>> = ({ colors, width, height, unit }) => {
  const bottom = height * 1.06;
  return (
    <>
      <Ridge base={bottom + 40 * unit} fill={colors.bush} chalk={{ seed: 'village-bush', width: 4 * unit }} points={[[-width * 0.1, bottom - 170 * unit], [60 * unit, bottom - 200 * unit], [220 * unit, bottom - 120 * unit], [330 * unit, bottom - 20 * unit]]} />
      <Placed x={120 * unit} y={bottom - 60 * unit} scale={unit}><Grass color={colors.grass} width={220} height={90} /></Placed>
      <Placed x={width - 100 * unit} y={bottom - 20 * unit} scale={unit}><Grass color={colors.grass} width={200} height={70} /></Placed>
    </>
  );
};

export const village: VectorBackgroundModel<Colors> = { layers: [Back, Middle, Front] };
