import type { FC, ReactNode } from 'react';
import { Silhouette } from '../../../../domain/drawing/Silhouette.ts';
import { ChalkLine } from '../../../drawing/ChalkLine.tsx';
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

type RidgeProps = Readonly<{ points: readonly (readonly [number, number])[]; base: number; fill: string; opacity?: number; chalk?: Chalk }>;
/** A chalk line on a background shape: its seed, width (in the units of the drawing it is in) and color (chalk by default). */
export type Chalk = Readonly<{ seed: string; width: number; color?: string }>;

// The top curve of a ridge: smooth through the midpoints between the given points.
function ridgeTop(points: RidgeProps['points']): string {
  const [first, ...rest] = points;
  const curve = rest.map(([x, y], index) => {
    const [previousX, previousY] = points[index]!;
    return `Q ${previousX} ${previousY} ${(previousX + x) / 2} ${(previousY + y) / 2}`;
  });
  const [lastX, lastY] = points.at(-1)!;
  return `M ${first![0]} ${first![1]} ${curve.join(' ')} L ${lastX} ${lastY}`;
}

/** A smooth silhouette (hills, bushes, roofs far away) through the points, closed down to `base`; chalk on its top. */
export const Ridge: FC<RidgeProps> = ({ points, base, fill, opacity, chalk }) => {
  const top = ridgeTop(points);
  const [[firstX], [lastX]] = [points[0]!, points.at(-1)!];
  return (
    <>
      <path d={`M ${firstX} ${base} L ${top.slice(2)} L ${lastX} ${base} Z`} fill={fill} opacity={opacity} />
      {chalk && <ChalkLine outline={Silhouette.parse(top)} seed={chalk.seed} width={chalk.width} color={chalk.color} />}
    </>
  );
};

type BoxProps = Readonly<{ x: number; y: number; width: number; height: number; corner?: number; fill?: string; chalk: Chalk }>;

/** A rectangle (rounded by `corner`) with the chalk line around it; without `fill`, only the line. */
export const ChalkBox: FC<BoxProps> = ({ x, y, width, height, corner = 0, fill, chalk }) => (
  <>
    {fill && <rect x={x} y={y} width={width} height={height} rx={corner} fill={fill} />}
    <ChalkLine outline={Silhouette.roundedRect({ x, y, width, height }, corner)} seed={chalk.seed} width={chalk.width} color={chalk.color} />
  </>
);

type ShapeProps = Readonly<{ path: string; fill?: string; opacity?: number; chalk: Chalk }>;

/** A path (absolute M, L, H, V, C, Q, Z) with the chalk line around it. */
export const ChalkShape: FC<ShapeProps> = ({ path, fill, opacity, chalk }) => (
  <>
    {fill && <path d={path} fill={fill} opacity={opacity} />}
    <ChalkLine outline={Silhouette.parse(path)} seed={chalk.seed} width={chalk.width} color={chalk.color} />
  </>
);

/** A disc with the chalk line around it. */
export const ChalkDisc: FC<Readonly<{ x: number; y: number; radius: number; fill?: string; chalk: Chalk }>> = ({ x, y, radius, fill, chalk }) => (
  <>
    {fill && <circle cx={x} cy={y} r={radius} fill={fill} />}
    <ChalkLine outline={Silhouette.ellipse({ x, y }, radius, radius)} seed={chalk.seed} width={chalk.width} color={chalk.color} />
  </>
);

type PlacedProps = Readonly<{ x: number; y: number; scale: number; flip?: boolean; children: ReactNode }>;

/** Draws its children in units around (`x`, `y`), mirrored when `flip`. */
export const Placed: FC<PlacedProps> = ({ x, y, scale, flip, children }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>{children}</g>
);

type TreeProps = Readonly<{ trunk: string; leaves: string; shade: string; height?: number; seed?: string }>;

/** A round-crowned tree standing on (0, 0), `height` units tall, with chalk on the trunk and the crown. */
export const Tree: FC<TreeProps> = ({ trunk, leaves, shade, height = 600, seed = 'tree' }) => {
  const crown = height * 0.42;
  const chalk = (part: string) => ({ seed: `${seed}-${part}`, width: 6 });
  return (
    <g>
      <ChalkShape path={`M -22 0 L -14 ${-height * 0.6} L 14 ${-height * 0.6} L 22 0 Z`} fill={trunk} chalk={chalk('trunk')} />
      <path d={`M -10 ${-height * 0.45} L -70 ${-height * 0.7} M 8 ${-height * 0.5} L 80 ${-height * 0.75}`} stroke={trunk} strokeWidth={14} strokeLinecap="round" />
      <circle cx={-crown * 0.45} cy={-height + crown * 0.9} r={crown * 0.62} fill={shade} />
      <circle cx={crown * 0.5} cy={-height + crown * 0.95} r={crown * 0.6} fill={shade} />
      <ChalkDisc x={0} y={-height + crown * 0.6} radius={crown * 0.7} fill={leaves} chalk={chalk('crown')} />
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
