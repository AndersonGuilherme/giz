import type { FC } from 'react';
import { ChalkBox, ChalkShape } from './parts.tsx';
import type { Palette } from './VectorBackgroundModel.ts';

// Pieces of the giz village, in units, standing on (0, 0): white houses with tiled roofs on a hill, a round tower,
// a windmill, a stone well and a fruit stall. Every main shape carries a chalk line.

type Piece = FC<Readonly<{ colors: Palette; seed: string }>>;
const line = (seed: string, part: string, width = 5) => ({ seed: `${seed}-${part}`, width });

/** A small house: whitewashed walls, a tiled roof of `roof` color, one window and a door. */
export const HillHouse: FC<Readonly<{ colors: Palette; seed: string; roof: string }>> = ({ colors, seed, roof }) => (
  <g>
    <ChalkBox x={-70} y={-90} width={140} height={90} fill={colors.wall} chalk={line(seed, 'wall')} />
    <rect x={30} y={-90} width={40} height={90} fill={colors.wallShade} />
    <ChalkShape path="M -88 -86 L 0 -150 L 88 -86 Z" fill={roof} chalk={line(seed, 'roof')} />
    <path d="M -56 -98 H 56 M -36 -116 H 36" stroke={colors.roofLine} strokeWidth={5} />
    <rect x={-48} y={-66} width={30} height={30} rx={6} fill={colors.window} />
    <path d="M 4 0 V -50 Q 22 -66 40 -50 V 0 Z" fill={colors.door} />
  </g>
);

/** A round tower with a pointed cap and a flag. */
export const Tower: Piece = ({ colors, seed }) => (
  <g>
    <ChalkBox x={-42} y={-230} width={84} height={230} corner={8} fill={colors.wall} chalk={line(seed, 'body')} />
    <rect x={12} y={-230} width={30} height={230} fill={colors.wallShade} />
    <ChalkShape path="M -56 -226 L 0 -320 L 56 -226 Z" fill={colors.roof2} chalk={line(seed, 'cap')} />
    <path d="M 0 -320 V -372 M 0 -372 L 40 -360 L 0 -348" stroke={colors.flag} strokeWidth={6} fill={colors.flag} />
    <rect x={-12} y={-180} width={24} height={36} rx={12} fill={colors.window} />
  </g>
);

/** A windmill on a hill: a tapered body and four sails. */
export const Windmill: Piece = ({ colors, seed }) => (
  <g>
    <ChalkShape path="M -46 0 L -30 -200 L 30 -200 L 46 0 Z" fill={colors.mill} chalk={line(seed, 'body')} />
    <ChalkShape path="M -40 -196 Q 0 -250 40 -196 Z" fill={colors.roof2} chalk={line(seed, 'cap')} />
    <g transform="translate(0 -206) rotate(20)">
      {[0, 90, 180, 270].map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <ChalkBox x={-14} y={-170} width={28} height={150} corner={4} fill={colors.millSail} chalk={line(seed, `sail${angle}`, 4)} />
        </g>
      ))}
      <circle r={12} fill={colors.wood} />
    </g>
  </g>
);

/** A stone well with a little gabled roof on two posts and a bucket. */
export const Well: Piece = ({ colors, seed }) => (
  <g>
    <ChalkBox x={-80} y={-90} width={160} height={90} corner={16} fill={colors.stone} chalk={line(seed, 'stone')} />
    <path d="M -80 -60 H 80 M -80 -30 H 80 M -30 -90 V -60 M 30 -60 V -30 M -10 -30 V 0" stroke={colors.stoneShade} strokeWidth={5} />
    <rect x={-74} y={-230} width={14} height={140} fill={colors.wood} />
    <rect x={60} y={-230} width={14} height={140} fill={colors.wood} />
    <ChalkShape path="M -110 -220 L 0 -290 L 110 -220 Z" fill={colors.roof} chalk={line(seed, 'roof')} />
    <path d="M -60 -190 H 60" stroke={colors.wood} strokeWidth={8} />
    <path d="M 10 -190 V -150" stroke={colors.stoneShade} strokeWidth={3} />
    <ChalkShape path="M -6 -150 L 26 -150 L 22 -118 L -2 -118 Z" fill={colors.awning} chalk={line(seed, 'bucket', 3)} />
  </g>
);

/** A fruit stall: a counter, two poles and a striped awning. */
export const Stall: Piece = ({ colors, seed }) => {
  const stripes = [-120, -72, -24, 24, 72];
  return (
    <g>
      <rect x={-130} y={-240} width={12} height={240} fill={colors.wood} />
      <rect x={118} y={-240} width={12} height={240} fill={colors.wood} />
      <ChalkBox x={-140} y={-100} width={280} height={100} corner={8} fill={colors.wood} chalk={line(seed, 'counter')} />
      {[-90, -50, -10, 30, 70, 104].map((x, index) => (
        <circle key={x} cx={x} cy={-112} r={20} fill={index % 2 ? colors.fruit1 : colors.fruit2} />
      ))}
      <path d="M -150 -240 L 150 -240 L 168 -190 L -168 -190 Z" fill={colors.awning} />
      {stripes.map((x) => <path key={x} d={`M ${x} -240 L ${x + 24} -240 L ${x * 1.12 + 27} -190 L ${x * 1.12} -190 Z`} fill={colors.awning2} />)}
      <ChalkShape path="M -150 -240 L 150 -240 L 168 -190 L -168 -190 Z" chalk={line(seed, 'awning')} />
    </g>
  );
};

/** A flat cloud: one puffy outline with a flat bottom. */
export const Cloud: Piece = ({ colors, seed }) => (
  <ChalkShape
    path="M -130 16 Q -156 -18 -112 -36 Q -96 -78 -44 -70 Q -14 -112 40 -94 Q 92 -100 102 -48 Q 146 -40 132 16 Z"
    fill={colors.cloud}
    chalk={line(seed, 'cloud', 4)}
  />
);
