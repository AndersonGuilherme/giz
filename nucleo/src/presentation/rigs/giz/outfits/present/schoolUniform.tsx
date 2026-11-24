import { shade } from '../../../svg.ts';
import { Garment, Patch, type Clothes } from '../Garment.tsx';
import { SHIRT } from '../shapes.ts';

// A white shirt with a collar, a V-neck sweater vest and a striped tie.
const VEST = 'M134,318 C150,306 170,300 178,300 L200,352 L222,300 C230,300 250,306 266,318 L276,452 C240,464 160,464 124,452 Z';
const COLLAR = ['M174,292 L200,314 L184,322 Z', 'M226,292 L200,314 L216,322 Z'];
const TIE = 'M195,312 L205,312 L210,360 L200,372 L190,360 Z';

export const schoolUniform: Clothes = {
  hem: 452,
  Torso: ({ look, palette }) => (
    <g>
      <Garment path={SHIRT} color={palette.sleeve} look={look} part="shirt" />
      <Patch path={TIE} color={palette.accent} look={look} part="tie" width={3} />
      <Garment path={VEST} color={palette.main} look={look} part="vest" />
      <path d="M136,440 Q200,452 264,440" fill="none" stroke={shade(palette.main, 0.25)} strokeWidth={5} />
      {COLLAR.map((path) => <path key={path} d={path} fill={shade(palette.sleeve, -0.08)} />)}
    </g>
  ),
};
