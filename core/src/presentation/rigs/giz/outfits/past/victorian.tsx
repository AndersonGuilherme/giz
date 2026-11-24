import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { BODICE, skirt } from '../shapes.ts';

// A long dress: fitted bodice with a lace high collar and buttons, a full skirt with a ruffled hem.
const COLLAR = 'M170,290 C180,276 220,276 230,290 L226,316 C214,308 186,308 174,316 Z';

export const victorian: Clothes = {
  hem: 560,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={skirt(396, 556, 52)} color={palette.main} look={look} part="skirt" />
      <path d="M90,540 Q200,566 310,540" fill="none" stroke={palette.accent} strokeWidth={9} strokeDasharray="14 8" />
      <path d="M150,420 Q200,470 250,420" fill="none" stroke={shade(palette.main, -0.25)} strokeWidth={5} />
      <Garment path={BODICE} color={palette.main} look={look} part="bodice" />
      {[330, 356, 382].map((y) => <circle key={y} cx={200} cy={y} r={5} fill={palette.accent} />)}
      <Patch path={COLLAR} color={palette.accent} look={look} part="lace" width={3.5} />
    </g>
  ),
};
