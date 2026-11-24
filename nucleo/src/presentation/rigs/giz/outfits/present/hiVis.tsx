import { Garment, type Clothes } from '../Garment.tsx';
import { SHIRT } from '../shapes.ts';

// A work shirt (the sleeve color) under an open high-visibility vest with two reflective bands.
const VEST = ['M128,304 C140,296 156,292 172,294 L184,456 L120,450 Z', 'M272,304 C260,296 244,292 228,294 L216,456 L280,450 Z'];

export const hiVis: Clothes = {
  hem: 452,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color={palette.secondary} look={look} part="shirt" />
      {VEST.map((path, index) => <Garment key={path} path={path} color={palette.main} look={look} part={`vest-${index}`} />)}
      {[372, 420].map((y) => (
        <g key={y} fill={palette.accent}>
          <rect x={122} y={y} width={60} height={12} />
          <rect x={218} y={y} width={60} height={12} />
        </g>
      ))}
    </g>
  ),
};
