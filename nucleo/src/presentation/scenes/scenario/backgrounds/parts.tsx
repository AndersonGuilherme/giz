import type { FC, ReactNode } from 'react';
import type { LayerProps } from './VectorBackgroundModel.ts';

// Shared drawing pieces of the vector backgrounds. Sizes are in "units" (1/1000 of the shorter side of the frame).

type Stops = readonly (readonly [number, string])[];

/** A vertical gradient that fills the whole layer, bleed included. */
export const Fill: FC<Readonly<{ id: string; stops: Stops; layer: LayerProps; from?: number; to?: number }>> = (props) => {
  const { width, height } = props.layer;
  const [top, bottom] = [props.from ?? -height * 0.1, props.to ?? height * 1.1];
  return (
    <>
      <defs>
        <linearGradient id={props.id} x1={0} y1={0} x2={0} y2={1}>
          {props.stops.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />)}
        </linearGradient>
      </defs>
      <rect x={-width * 0.1} y={top} width={width * 1.2} height={bottom - top} fill={`url(#${props.id})`} />
    </>
  );
};

type GlowProps = Readonly<{ id: string; x: number; y: number; radius: number; color: string; opacity?: number }>;

/** A soft round light that fades to transparent at its edge. */
export const Glow: FC<GlowProps> = ({ id, x, y, radius, color, opacity = 1 }) => (
  <>
    <defs>
      <radialGradient id={id}>
        <stop offset={0} stopColor={color} stopOpacity={opacity} />
        <stop offset={0.45} stopColor={color} stopOpacity={opacity * 0.35} />
        <stop offset={1} stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={radius} fill={`url(#${id})`} />
  </>
);

type RidgeProps = Readonly<{ points: readonly (readonly [number, number])[]; base: number; fill: string; opacity?: number }>;

/** A smooth silhouette (hills, bushes, roofs far away) through the points, closed down to `base`. */
export const Ridge: FC<RidgeProps> = ({ points, base, fill, opacity }) => {
  const [first, ...rest] = points;
  const curve = rest.map(([x, y], index) => {
    const [previousX, previousY] = points[index]!;
    return `Q ${previousX} ${previousY} ${(previousX + x) / 2} ${(previousY + y) / 2}`;
  });
  const [lastX, lastY] = points.at(-1)!;
  const path = `M ${first![0]} ${base} L ${first![0]} ${first![1]} ${curve.join(' ')} L ${lastX} ${lastY} L ${lastX} ${base} Z`;
  return <path d={path} fill={fill} opacity={opacity} />;
};

type PlacedProps = Readonly<{ x: number; y: number; scale: number; flip?: boolean; children: ReactNode }>;

/** Draws its children in units around (`x`, `y`), mirrored when `flip`. */
export const Placed: FC<PlacedProps> = ({ x, y, scale, flip, children }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>{children}</g>
);

type TreeProps = Readonly<{ trunk: string; leaves: string; shade: string; height?: number }>;

/** A round-crowned tree standing on (0, 0), `height` units tall. */
export const Tree: FC<TreeProps> = ({ trunk, leaves, shade, height = 600 }) => {
  const crown = height * 0.42;
  return (
    <g>
      <path d={`M -22 0 L -14 ${-height * 0.6} L 14 ${-height * 0.6} L 22 0 Z`} fill={trunk} />
      <path d={`M -10 ${-height * 0.45} L -70 ${-height * 0.7} M 8 ${-height * 0.5} L 80 ${-height * 0.75}`} stroke={trunk} strokeWidth={14} strokeLinecap="round" />
      <circle cx={-crown * 0.45} cy={-height + crown * 0.9} r={crown * 0.62} fill={shade} />
      <circle cx={crown * 0.5} cy={-height + crown * 0.95} r={crown * 0.6} fill={shade} />
      <circle cx={0} cy={-height + crown * 0.6} r={crown * 0.7} fill={leaves} />
      <circle cx={-crown * 0.55} cy={-height + crown * 1.15} r={crown * 0.45} fill={leaves} />
      <circle cx={crown * 0.6} cy={-height + crown * 1.2} r={crown * 0.42} fill={leaves} />
    </g>
  );
};

/** Grass blades standing on (0, 0), `width` units wide. */
export const Grass: FC<Readonly<{ color: string; width: number; height: number }>> = ({ color, width, height }) => {
  const blades = Array.from({ length: Math.round(width / 14) }, (_empty, index) => index * 14 - width / 2);
  const tall = (index: number) => height * (0.55 + 0.45 * Math.abs(Math.sin(index * 2.3)));
  const path = blades.map((x, index) => `M ${x - 6} 0 Q ${x + 2} ${-tall(index) * 0.6} ${x + 8} ${-tall(index)} Q ${x + 4} ${-tall(index) * 0.5} ${x + 6} 0 Z`);
  return <path d={path.join(' ')} fill={color} />;
};

// Fixed star field (fractions of the area and size in units): the same sky in every frame and every render.
const STAR_FIELD = [
  [0.04, 0.12, 2.4], [0.11, 0.42, 1.6], [0.17, 0.08, 1.8], [0.23, 0.3, 2.6], [0.31, 0.55, 1.4], [0.36, 0.16, 2],
  [0.44, 0.38, 1.6], [0.5, 0.06, 2.4], [0.57, 0.26, 1.8], [0.63, 0.5, 1.4], [0.69, 0.12, 2.2], [0.74, 0.36, 1.6],
  [0.8, 0.62, 1.4], [0.9, 0.3, 2.4], [0.95, 0.08, 1.8], [0.08, 0.7, 1.4], [0.27, 0.78, 1.2], [0.47, 0.7, 1.2],
  [0.6, 0.82, 1.2], [0.98, 0.52, 1.6], [0.14, 0.24, 1.2], [0.4, 0.04, 1.4], [0.86, 0.46, 1.2], [0.53, 0.44, 2],
] as const;

/** A fixed field of small stars over a `width` × `height` area from the top of the layer. */
export const Stars: FC<Readonly<{ color: string; width: number; height: number; unit: number }>> = ({ color, width, height, unit }) => (
  <g fill={color}>
    {STAR_FIELD.map(([x, y, size]) => <circle key={`${x}-${y}`} cx={x * width} cy={y * height} r={size * unit} opacity={0.35 + size / 5} />)}
  </g>
);
