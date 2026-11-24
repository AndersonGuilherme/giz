import { shade } from '../../../svg.ts';
import { Garment, type Clothes } from '../Garment.tsx';
import { coatHalves, SHIRT } from '../shapes.ts';

// A loose white shirt under a long open coat with gold buttons, a wide sash at the waist.
const [LEFT, RIGHT] = coatHalves(520, 30);

export const pirate: Clothes = {
  hem: 520,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color="#f1ece0" look={look} part="shirt" />
      <path d="M180,296 L200,340 L220,296" fill="none" stroke="#c9c1ad" strokeWidth={4} />
      <path d="M124,412 Q200,428 276,412 L278,440 Q200,456 122,440 Z" fill={shade(palette.accent, -0.55)} />
      <Garment path={LEFT} color={palette.main} look={look} part="coat-left" />
      <Garment path={RIGHT} color={palette.main} look={look} part="coat-right" />
      {[340, 380, 470].flatMap((y) => [158, 242].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r={6} fill={palette.accent} />))}
    </g>
  ),
};
