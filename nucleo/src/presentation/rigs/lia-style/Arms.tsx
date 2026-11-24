import type { FC } from 'react';
import type { LiaArm, LiaPose } from '../../../domain/character/LiaStyleGeometry.ts';
import { ARM, SHOULDERS } from './measures.ts';
import { warmShade } from './palette.ts';
import type { Look } from './parameters.ts';

/**
 * Upper arm (shoulder → elbow) and forearm (elbow → hand), each with its own pivot, as in the motor. Unlike the motor,
 * sleeves and hand get a thin outline, so an arm folded over the hoodie or a hand over the face still reads.
 */
const Arm: FC<Readonly<{ arm: LiaArm; side: 'left' | 'right'; look: Look }>> = ({ arm, side, look }) => {
  const shoulder = SHOULDERS[side];
  const outline = { stroke: look.hoodieShade, strokeWidth: 3 };
  return (
    <g transform={`translate(${shoulder.x} ${shoulder.y}) rotate(${shoulder.rest + arm.shoulder})`}>
      <rect x={-17} y={-12} width={34} height={ARM.upper + 16} rx={17} fill={look.hoodieColor} {...outline} />
      <g transform={`translate(0 ${ARM.upper}) rotate(${arm.elbow})`}>
        <rect x={-15} y={-10} width={30} height={ARM.hand - 4} rx={15} fill={look.hoodieColor} {...outline} />
        <rect x={-16} y={ARM.hand - 22} width={32} height={12} rx={6} fill={look.hoodieShade} />
        <circle cx={0} cy={ARM.hand} r={16} fill={look.skin} stroke={warmShade(look.skin)} strokeWidth={3} />
      </g>
    </g>
  );
};

/** The arms of the pose that go behind the head, or the ones that go in front of it. */
export const Arms: FC<Readonly<{ pose: LiaPose; look: Look; inFront: boolean }>> = ({ pose, look, inFront }) => (
  <g>
    {(['left', 'right'] as const)
      .filter((side) => pose[side].inFront === inFront)
      .map((side) => <Arm key={side} arm={pose[side]} side={side} look={look} />)}
  </g>
);
