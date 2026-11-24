import type { FC } from 'react';
import type { Emblem as EmblemName, Look } from './parameters.ts';
import { PALETTE } from './palette.ts';
import { starPath } from './shapes.ts';

type OutfitProps = Readonly<{ look: Look; side: -1 | 1 }>;

const LEG = { left: 'M140,410 h56 l-4,120 h-46 Z', right: 'M204,410 h56 l-6,120 h-46 Z' } as const;
const SHOE = {
  left: 'M130,556 C130,538 150,530 170,530 C186,530 196,538 196,550 L196,562 H134 Z',
  right: 'M204,550 C204,538 214,530 230,530 C250,530 270,538 270,556 L266,562 H204 Z',
} as const;

// Jeans with rolled cuffs and sneakers in the hoodie color.
const Legs: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <g>
    <path fill={PALETTE.jeans} d={LEG.left} />
    <path fill={PALETTE.jeans} d={LEG.right} />
    <rect x={142} y={512} width={54} height={20} rx={6} fill={PALETTE.jeansCuff} />
    <rect x={204} y={512} width={54} height={20} rx={6} fill={PALETTE.jeansCuff} />
    <path fill={look.hoodieColor} d={SHOE.left} />
    <path fill={look.hoodieColor} d={SHOE.right} />
    <rect x={128} y={558} width={70} height={12} rx={6} fill={PALETTE.sole} />
    <rect x={202} y={558} width={70} height={12} rx={6} fill={PALETTE.sole} />
  </g>
);

// The code emblem is text: a mirrored character turns it back so it still reads `</>`.
const EMBLEMS: Readonly<Record<EmblemName, FC<Readonly<{ side: -1 | 1 }>>>> = {
  star: () => <path fill={PALETTE.star} d={starPath(246, 336, 11)} />,
  code: ({ side }) => (
    <text x={200} y={398} textAnchor="middle" fontFamily="monospace" fontWeight={900} fontSize={26} fill={PALETTE.code}
      transform={side < 0 ? 'translate(400 0) scale(-1 1)' : undefined}>
      {'</>'}
    </text>
  ),
  none: () => null,
};

/** Legs and hoodie (pocket, hood edge, drawstrings and the emblem); the arms draw their own sleeves. */
export const Outfit: FC<OutfitProps> = ({ look, side }) => {
  const Emblem = EMBLEMS[look.emblem];
  return (
    <g>
      <Legs look={look} />
      <path fill={look.hoodieColor} d="M126,296 C150,282 250,282 274,296 C286,330 286,390 280,420 C240,432 160,432 120,420 C114,390 114,330 126,296 Z" />
      <path fill={look.hoodieShade} d="M150,370 h100 l-8,40 h-84 Z" opacity={0.55} />
      <path fill={look.hoodieShade} d="M150,288 C170,312 230,312 250,288 C232,300 168,300 150,288 Z" />
      <path stroke={PALETTE.drawstring} strokeWidth={4} strokeLinecap="round" d="M184,304 v34 M216,304 v34" />
      <circle cx={184} cy={340} r={4} fill={PALETTE.drawstring} />
      <circle cx={216} cy={340} r={4} fill={PALETTE.drawstring} />
      <Emblem side={side} />
    </g>
  );
};
