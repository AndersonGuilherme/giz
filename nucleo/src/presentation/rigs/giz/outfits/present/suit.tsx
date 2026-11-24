import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { LONG_TOP } from '../shapes.ts';

// A jacket with lapels over a white shirt and a tie in the accent color, two buttons.
const SHIRT_FRONT = 'M168,292 L200,380 L232,292 Z';
const TIE = 'M194,304 L206,304 L212,368 L200,384 L188,368 Z';
const LAPELS = ['M168,292 L200,380 L176,336 L150,318 Z', 'M232,292 L200,380 L224,336 L250,318 Z'];

export const suit: Clothes = {
  hem: 470,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={LONG_TOP} color={palette.main} look={look} part="jacket" />
      <Patch path={SHIRT_FRONT} color="#f4f2ec" look={look} part="shirt" width={3} />
      <Patch path={TIE} color={palette.accent} look={look} part="tie" width={3} />
      {LAPELS.map((path) => <path key={path} d={path} fill={shade(palette.main, -0.22)} />)}
      {[410, 440].map((y) => <circle key={y} cx={200} cy={y} r={5} fill={shade(palette.main, 0.35)} />)}
    </g>
  ),
};
