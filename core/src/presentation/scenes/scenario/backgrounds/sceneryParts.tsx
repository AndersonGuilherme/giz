import type { FC, ReactNode } from 'react';
import type { Corner } from '../../../../domain/scenario/BackdropLayout.ts';
import { SkyLayout } from '../../../../domain/scenario/SkyLayout.ts';
import { AspectRatio } from '../../../../domain/values/AspectRatio.ts';
import { ChalkDisc, Glow, Placed } from './parts.tsx';
import type { LayerProps } from './VectorBackgroundModel.ts';

// Drawing pieces shared by the era backgrounds (cave, forum, castle, diner, station…). Sizes are in units unless said.

/** `count` evenly spaced fractions from `from` to `to` (both included). */
export const spread = (count: number, from: number, to: number): number[] =>
  Array.from({ length: count }, (_empty, index) => from + ((to - from) * index) / Math.max(1, count - 1));

/**
 * A front prop on one of the backdrop's corners, drawn in prop units (see `FRONT_PROP`): it stands on (0, 0) and its
 * inner side is +x, so the right corner mirrors it.
 */
export const CornerProp: FC<Readonly<{ corner: Corner; right?: boolean; children: ReactNode }>> = ({ corner, right, children }) => (
  <Placed x={corner.x} y={corner.y} scale={corner.scale} flip={right}>{children}</Placed>
);

/** The same front prop in both corners of the layer, the right one mirrored. */
export const CornerProps: FC<Readonly<{ layer: LayerProps; children: ReactNode }>> = ({ layer, children }) => (
  <>
    <CornerProp corner={layer.backdrop.corners.left}>{children}</CornerProp>
    <CornerProp corner={layer.backdrop.corners.right} right>{children}</CornerProp>
  </>
);

/** Floor lines running from the horizon toward the viewer (planks, tiles, paving), as a vanishing perspective. */
export const FloorLines: FC<Readonly<{ layer: LayerProps; color: string; count?: number; opacity?: number }>> = ({ layer, color, count = 13, opacity = 0.5 }) => {
  const { width, height, unit, backdrop } = layer;
  const leans = spread(count, -1, 1);
  const path = leans.map((lean) => `M ${width * (0.5 + lean * 0.4)} ${backdrop.horizon} L ${width * (0.5 + lean * 1.3)} ${height * 1.1}`);
  return <path d={path.join(' ')} stroke={color} strokeWidth={4 * unit} opacity={opacity} fill="none" />;
};

/** Floor rows across (tiles, deck boards): lines that get further apart toward the viewer. */
export const FloorRows: FC<Readonly<{ layer: LayerProps; color: string; count?: number; opacity?: number }>> = ({ layer, color, count = 7, opacity = 0.5 }) => {
  const { width, height, unit, backdrop } = layer;
  const depth = height * 1.1 - backdrop.horizon;
  const rows = spread(count, 0.08, 1).map((share) => backdrop.horizon + depth * share * share);
  return <path d={rows.map((y) => `M ${-width * 0.1} ${y} H ${width * 1.1}`).join(' ')} stroke={color} strokeWidth={3 * unit} opacity={opacity} />;
};

/** The night moon of every outdoor night background, kept clear of the HUD by `SkyLayout`. */
export const Moon: FC<Readonly<{ layer: LayerProps; color: string; glow: string; seed: string }>> = ({ layer, color, glow, seed }) => {
  const moon = SkyLayout.moon(AspectRatio.ofSize(layer.width, layer.height));
  return (
    <>
      <Glow id={`${seed}-glow`} x={moon.x} y={moon.y} radius={moon.radius * 3.4} color={glow} opacity={0.38} />
      <ChalkDisc x={moon.x} y={moon.y} radius={moon.radius} fill={color} chalk={{ seed, width: 5 * layer.unit }} />
      <circle cx={moon.x - moon.radius * 0.32} cy={moon.y + moon.radius * 0.18} r={moon.radius * 0.2} fill={glow} opacity={0.25} />
    </>
  );
};

/** A soft band of fog across the layer at `y` (video pixels), `depth` units thick. */
export const Fog: FC<Readonly<{ layer: LayerProps; y: number; color: string; depth?: number; opacity?: number }>> = ({ layer, y, color, depth = 120, opacity = 0.35 }) => {
  const { width, unit } = layer;
  const puffs = spread(7, -0.05, 1.05);
  return (
    <g fill={color} opacity={opacity} style={{ filter: `blur(${18 * unit}px)` }}>
      {puffs.map((at, index) => (
        <ellipse key={at} cx={width * at} cy={y + (index % 2) * depth * 0.2} rx={width * 0.16} ry={depth * unit * (0.4 + (index % 3) * 0.12)} />
      ))}
    </g>
  );
};

/** A hanging lamp: a cord from above the frame down to `y`, a shade and its light. */
export const HangingLamp: FC<Readonly<{ x: number; y: number; unit: number; shade: string; light: string; seed: string }>> = (props) => {
  const { x, y, unit, shade, light, seed } = props;
  return (
    <>
      <path d={`M ${x} ${-200 * unit} V ${y}`} stroke={shade} strokeWidth={4 * unit} />
      <Glow id={`${seed}-light`} x={x} y={y + 40 * unit} radius={260 * unit} color={light} opacity={0.4} />
      <Placed x={x} y={y} scale={unit}>
        <path d="M -60 50 Q -50 0 0 0 Q 50 0 60 50 Z" fill={shade} />
        <ellipse cx={0} cy={50} rx={60} ry={10} fill={light} />
      </Placed>
    </>
  );
};
