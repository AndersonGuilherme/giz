import type { FC } from 'react';
import type { Palette } from './VectorBackgroundModel.ts';

// Pieces of the village, in units, standing on (0, 0). Timber-framed houses with thatched roofs and warm windows.

const LitWindow: FC<Readonly<{ x: number; y: number; colors: Palette }>> = ({ x, y, colors }) => (
  <g>
    <circle cx={x + 22} cy={y + 28} r={70} fill="url(#village-window-glow)" />
    <rect x={x} y={y} width={44} height={56} rx={4} fill={colors.window} />
    <path d={`M ${x + 22} ${y} V ${y + 56} M ${x} ${y + 26} H ${x + 44}`} stroke={colors.timber} strokeWidth={6} />
    <rect x={x} y={y} width={44} height={56} rx={4} fill="none" stroke={colors.timber} strokeWidth={7} />
  </g>
);

const Thatch: FC<Readonly<{ colors: Palette }>> = ({ colors }) => {
  const strands = Array.from({ length: 13 }, (_empty, index) => -165 + index * 27);
  return (
    <g>
      <path d="M -190 -176 L -18 -336 Q 0 -348 18 -336 L 190 -176 Q 0 -160 -190 -176 Z" fill={colors.roof} />
      <path d="M -190 -176 Q 0 -160 190 -176 L 182 -160 Q 0 -146 -182 -160 Z" fill={colors.roofShade} />
      <path d={strands.map((x) => `M ${x * 0.12} -322 L ${x} -172`).join(' ')} stroke={colors.roofShade} strokeWidth={4} opacity={0.6} />
      <path d="M 0 -340 L 190 -176 L 120 -170 Z" fill="#000000" opacity={0.18} />
    </g>
  );
};

/** A house 300 units wide: wall with timbers, a door, two lit windows and a thatched roof. */
export const House: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <rect x={-150} y={-192} width={300} height={192} fill={colors.wall} />
    <rect x={60} y={-192} width={90} height={192} fill="#000000" opacity={0.2} />
    <path
      d="M -150 -96 H 150 M -60 -192 V 0 M 60 -192 V 0 M -150 -192 L -60 -96 M 60 -96 L 150 -192"
      stroke={colors.timber}
      strokeWidth={11}
      fill="none"
    />
    <rect x={-150} y={-192} width={300} height={192} fill="none" stroke={colors.timber} strokeWidth={12} />
    <path d="M -34 0 V -104 Q 0 -136 34 -104 V 0 Z" fill={colors.timber} />
    <circle cx={20} cy={-50} r={4} fill={colors.window} />
    <LitWindow x={-130} y={-80} colors={colors} />
    <LitWindow x={84} y={-80} colors={colors} />
    <Thatch colors={colors} />
    <rect x={70} y={-330} width={34} height={90} fill={colors.timber} />
  </g>
);

/** A small chapel with a bell tower, as a far silhouette with one lit window. */
export const Chapel: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g fill={colors.farHouses}>
    <rect x={-90} y={-110} width={150} height={110} />
    <path d="M -100 -110 L -15 -170 L 70 -110 Z" />
    <rect x={40} y={-260} width={56} height={260} />
    <path d="M 32 -260 L 68 -330 L 104 -260 Z" />
    <rect x={58} y={-228} width={20} height={30} rx={10} fill={colors.window} opacity={0.85} />
  </g>
);

/** A far cottage: a dark block with a roof and a lit window. */
export const Cottage: FC<Readonly<{ colors: Palette; light: boolean }>> = ({ colors, light }) => (
  <g fill={colors.farHouses}>
    <rect x={-50} y={-60} width={100} height={60} />
    <path d="M -62 -58 L 0 -105 L 62 -58 Z" />
    {light && <rect x={-14} y={-42} width={22} height={22} fill={colors.window} opacity={0.9} />}
  </g>
);

/** A barrel and a sack, a corner of the foreground. */
export const BarrelAndSack: FC<Readonly<{ colors: Palette }>> = ({ colors }) => (
  <g>
    <path d="M -60 0 Q -74 -70 -60 -140 L 60 -140 Q 74 -70 60 0 Z" fill={colors.barrel} />
    <path d="M -66 -30 H 66 M -70 -110 H 70" stroke={colors.foreground} strokeWidth={10} />
    <ellipse cx={0} cy={-140} rx={60} ry={14} fill={colors.foreground} opacity={0.5} />
    <path d="M 70 0 Q 60 -70 100 -96 Q 112 -110 130 -96 Q 170 -70 160 0 Z" fill={colors.sack} />
    <path d="M 100 -96 Q 115 -84 130 -96" stroke={colors.foreground} strokeWidth={6} fill="none" />
  </g>
);

/** Posts and rails of a wooden fence, `width` units long. */
export const Fence: FC<Readonly<{ color: string; width: number }>> = ({ color, width }) => {
  const posts = Array.from({ length: Math.ceil(width / 110) + 1 }, (_empty, index) => index * 110);
  return (
    <g fill={color}>
      {posts.map((x) => <rect key={x} x={x - 9} y={-150} width={18} height={150} rx={4} />)}
      <rect x={0} y={-118} width={width} height={12} rx={4} />
      <rect x={0} y={-66} width={width} height={12} rx={4} />
    </g>
  );
};

type RutsProps = Readonly<{ color: string; width: number; horizon: number; bottom: number }>;

/** Wheel ruts and a few stones on the dirt square, converging to the horizon. */
export const Ruts: FC<RutsProps> = ({ color, width, horizon, bottom }) => (
  <g stroke={color} strokeLinecap="round" fill="none" opacity={0.7}>
    <path d={`M ${width * 0.47} ${horizon} Q ${width * 0.4} ${(horizon + bottom) / 2} ${width * 0.3} ${bottom}`} strokeWidth={10} />
    <path d={`M ${width * 0.53} ${horizon} Q ${width * 0.6} ${(horizon + bottom) / 2} ${width * 0.72} ${bottom}`} strokeWidth={10} />
    <g fill={color} stroke="none">
      {[[0.36, 0.3], [0.62, 0.45], [0.2, 0.62], [0.82, 0.7], [0.55, 0.85]].map(([x, depth]) => (
        <ellipse key={x} cx={width * x!} cy={horizon + (bottom - horizon) * depth!} rx={10 + 18 * depth!} ry={4 + 7 * depth!} />
      ))}
    </g>
  </g>
);
