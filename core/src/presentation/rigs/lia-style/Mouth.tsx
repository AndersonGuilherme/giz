import type { FC } from 'react';
import type { CharacterState } from '../../../domain/character/CharacterState.ts';
import type { LiaMouthShape } from '../../../domain/character/LiaStyleGeometry.ts';
import { LiaStyleMouth, type LiaMouth } from '../../../domain/character/LiaStyleMouth.ts';
import { MOUTH } from './measures.ts';
import { PALETTE } from './palette.ts';
import type { Look } from './parameters.ts';

const STROKE = { fill: 'none', stroke: PALETTE.ink, strokeWidth: 6, strokeLinecap: 'round' } as const;

type ShapeProps = Readonly<{ smile: number }>;

// The motor's silent mouths, in its coordinates (mouth point at 200, 242); `smile` is the character's smile width.
const SHAPES: Readonly<Record<LiaMouthShape, FC<ShapeProps>>> = {
  smile: ({ smile }) => <path {...STROKE} d={`M${MOUTH.x - smile / 2},238 Q200,254 ${MOUTH.x + smile / 2},238`} />,
  grin: () => (
    <g>
      <path fill={PALETTE.ink} d="M182,236 Q200,238 218,236 Q214,262 200,262 Q186,262 182,236 Z" />
      <path fill={PALETTE.tongue} d="M190,254 Q200,248 210,254 Q205,261 200,261 Q195,261 190,254 Z" />
    </g>
  ),
  big: () => (
    <g>
      <path fill={PALETTE.ink} d="M176,234 Q200,237 224,234 Q220,270 200,270 Q180,270 176,234 Z" />
      <path fill={PALETTE.tongue} d="M187,258 Q200,250 213,258 Q207,268 200,268 Q193,268 187,258 Z" />
      <rect x={186} y={235} width={28} height={7} rx={3} fill={PALETTE.teeth} />
    </g>
  ),
  'o': () => <ellipse cx={200} cy={246} rx={10} ry={13} fill={PALETTE.ink} />,
  wavy: () => <path {...STROKE} d="M184,245 q8,-7 16,0 t16,0" />,
  flat: () => <path {...STROKE} d="M192,245 L214,241" />,
  smirk: () => <path {...STROKE} d="M186,245 Q204,248 216,236" />,
  frown: () => <path {...STROKE} d="M186,249 Q200,238 214,249" />,
  grit: () => (
    <g>
      <rect x={183} y={237} width={34} height={15} rx={6} fill={PALETTE.ink} />
      <rect x={186} y={240} width={28} height={9} rx={3} fill={PALETTE.teeth} />
      <path d="M186,244.5 H214" stroke={PALETTE.ink} strokeWidth={1.5} />
    </g>
  ),
  gasp: () => (
    <g>
      <path fill={PALETTE.ink} d="M180,258 Q200,224 220,258 Q200,264 180,258 Z" />
      <ellipse cx={200} cy={256} rx={8} ry={3} fill={PALETTE.tongue} />
    </g>
  ),
};

const OpenMouth: FC<Readonly<{ mouth: Extract<LiaMouth, { kind: 'open' }> }>> = ({ mouth }) => {
  const [x, y] = [MOUTH.x, MOUTH.y];
  const { teeth, tongue } = mouth;
  return (
    <g>
      <ellipse cx={x} cy={y + mouth.cy} rx={mouth.rx} ry={mouth.ry} fill={PALETTE.ink} />
      {teeth && <rect x={x + teeth.x} y={y + teeth.y} width={teeth.width} height={teeth.height} rx={2} fill={PALETTE.teeth} />}
      {tongue && <ellipse cx={x + tongue.cx} cy={y + tongue.cy} rx={tongue.rx} ry={tongue.ry} fill={PALETTE.tongue} />}
    </g>
  );
};

/** Draws the mouth the domain chose for this state. */
export const Mouth: FC<Readonly<{ state: CharacterState; look: Look }>> = ({ state, look }) => {
  const mouth = LiaStyleMouth.for(state);
  if (mouth.kind === 'open') return <OpenMouth mouth={mouth} />;
  if (mouth.kind === 'closed') return <path {...STROKE} d={`M${MOUTH.x - mouth.halfWidth},243 L${MOUTH.x + mouth.halfWidth},243`} />;
  const Shape = SHAPES[mouth.shape];
  return <Shape smile={look.smile} />;
};
