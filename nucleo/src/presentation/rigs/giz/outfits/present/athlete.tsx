import { shade } from '../../../svg.ts';
import { skinOf } from '../../parameters.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { SHIRT } from '../shapes.ts';

// A sleeveless jersey with side stripes and a round number badge, over shorts.
const JERSEY = 'M144,300 C160,292 172,290 180,294 Q200,316 220,294 C228,290 240,292 256,300 L276,440 C240,452 160,452 124,440 Z';
const SHORTS = 'M124,430 L276,430 L284,494 L206,498 L200,470 L194,498 L116,494 Z';

export const athlete: Clothes = {
  hem: 494,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color={skinOf(look).base} look={look} part="chest" />
      <Garment path={SHORTS} color={shade(palette.main, -0.4)} look={look} part="shorts" />
      <Garment path={JERSEY} color={palette.main} look={look} part="jersey" />
      <path d="M138,330 L128,436 M262,330 L272,436" stroke={palette.accent} strokeWidth={7} />
      <Patch path="M180,350 L220,350 L222,392 L178,392 Z" color={palette.accent} look={look} part="number" width={3} />
      <path d="M194,360 L206,360 L198,384" fill="none" stroke={palette.main} strokeWidth={5} strokeLinecap="round" />
    </g>
  ),
};
