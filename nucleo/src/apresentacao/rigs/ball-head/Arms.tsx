import type { FC } from 'react';
import type { Arm as ArmShape, Hand as HandShape } from '../../../dominio/personagem/ArmGeometry.ts';
import { ARM, SHOULDERS } from './measures.ts';
import type { Look } from './parameters.ts';
import { shade } from './svg.ts';

type ArmProps = Readonly<{ arm: ArmShape; side: -1 | 1; look: Look }>;

// Mitten hands in the head color, drawn along +y (the forearm direction).
const HAND_SHAPES: Readonly<Record<HandShape, FC<Readonly<{ color: string; side: -1 | 1 }>>>> = {
  open: ({ color, side }) => (
    <g fill={color}>
      <ellipse cx={0} cy={ARM.fore + 10} rx={19} ry={23} />
      <ellipse cx={side * 15} cy={ARM.fore + 2} rx={8} ry={12} transform={`rotate(${side * -30} ${side * 15} ${ARM.fore + 2})`} />
    </g>
  ),
  fist: ({ color }) => <circle cx={0} cy={ARM.fore + 6} r={20} fill={color} />,
  index: ({ color }) => (
    <g fill={color}>
      <circle cx={0} cy={ARM.fore + 6} r={19} />
      <rect x={-6} y={ARM.fore + 8} width={12} height={36} rx={6} />
    </g>
  ),
};

const Hand: FC<Readonly<{ shape: HandShape; side: -1 | 1; color: string }>> = ({ shape, side, color }) => {
  const Shape = HAND_SHAPES[shape];
  return (
    <g transform={`translate(0 ${ARM.fore}) scale(1.3) translate(0 ${-ARM.fore})`}>
      <Shape color={color} side={side} />
      <path d={`M-10,${ARM.fore + 2} q-2,9 3,16`} fill="none" stroke={shade(color, 0.22)} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

const Forearm: FC<ArmProps> = ({ arm, side, look }) => {
  const short = look.outfit === 'tshirt';
  const color = short ? look.headColor : look.outfitColor;
  return (
    <g transform={`translate(0 ${ARM.upper * arm.foreshortening}) rotate(${-side * arm.elbow})`}>
      <rect x={-ARM.thickness / 2 + 1} y={-12} width={ARM.thickness - 2} height={ARM.fore + 6} rx={15} fill={color} />
      {!short && <rect x={-ARM.thickness / 2} y={ARM.fore - 14} width={ARM.thickness} height={10} rx={5} fill={shade(color, -0.25)} />}
      <g transform={`rotate(${-side * arm.wrist} 0 ${ARM.fore})`}>
        <Hand shape={arm.hand} side={side} color={look.headColor} />
      </g>
    </g>
  );
};

/** Upper arm (shoulder → elbow) and forearm, each with its own pivot; a t-shirt shows the skin below the sleeve. */
export const Arm: FC<ArmProps> = (props) => {
  const { arm, side, look } = props;
  const shoulder = side < 0 ? SHOULDERS.left : SHOULDERS.right;
  const length = ARM.upper * arm.foreshortening;
  const sleeve = look.outfit === 'tshirt' ? Math.min(length, 46) : length + 12;
  return (
    <g transform={`translate(${shoulder.x} ${shoulder.y}) rotate(${-side * arm.shoulder})`}>
      <rect x={-ARM.thickness / 2} y={-14} width={ARM.thickness} height={length + 26} rx={16} fill={look.headColor} />
      <rect x={-ARM.thickness / 2 - 2} y={-16} width={ARM.thickness + 4} height={sleeve + 16} rx={17} fill={look.outfitColor} />
      <Forearm {...props} />
    </g>
  );
};
