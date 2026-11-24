import type { FC } from 'react';
import { LiaStyleGeometry, type LiaEyes, type LiaFace } from '../../../domain/character/LiaStyleGeometry.ts';
import { useSvgId } from '../svg.ts';
import { BROWS, EYES } from './measures.ts';
import { browColor, PALETTE } from './palette.ts';
import type { Look } from './parameters.ts';
import { starPath } from './shapes.ts';

type Side = 'left' | 'right';

// Two sparkles per eye, [dx, dy, size] from the eye center, mirrored between the eyes as in the motor.
const SPARKLES: Readonly<Record<Side, readonly (readonly [number, number, number])[]>> = {
  left: [[4, -6, 10], [-8, 9, 5]],
  right: [[-4, -6, 10], [9, 9, 5]],
};
const LID_SPAN = EYES.radius * 2 + 2; // the lids cover the clip circle (radius + 1) from its top or bottom

const Eye: FC<Readonly<{ eyes: LiaEyes; side: Side; skin: string }>> = ({ eyes, side, skin }) => {
  const clip = useSvgId('eye');
  const [x, top] = [EYES[side], EYES.y - EYES.radius - 1];
  const [upper, lower] = [LID_SPAN * eyes.upper, LID_SPAN * eyes.lower];
  return (
    <g>
      <clipPath id={clip}><circle cx={x} cy={EYES.y} r={EYES.radius + 1} /></clipPath>
      <g transform={`translate(${eyes.pupil.x} ${eyes.pupil.y})`}>
        <circle cx={x} cy={EYES.y} r={EYES.radius} fill={PALETTE.ink} />
        {SPARKLES[side].map(([dx, dy, size]) => <path key={size} fill={PALETTE.sparkle} d={starPath(x + dx, EYES.y + dy, size)} />)}
      </g>
      <g clipPath={`url(#${clip})`}>
        <rect x={x - 30} y={top} width={60} height={upper + 0.01} fill={skin} />
        <rect x={x - 30} y={top + LID_SPAN - lower} width={60} height={lower + 0.01} fill={skin} />
        {eyes.lidLine && <line x1={x - 26} x2={x + 26} y1={top + upper} y2={top + upper} stroke={PALETTE.ink} strokeWidth={4} strokeLinecap="round" />}
      </g>
    </g>
  );
};

export const Eyes: FC<Readonly<{ eyes: LiaEyes; look: Look }>> = ({ eyes, look }) => (
  <g>
    <Eye eyes={eyes} side="left" skin={look.skin} />
    <Eye eyes={eyes} side="right" skin={look.skin} />
  </g>
);

/** Round glasses with a bridge and the temples going to the ears. */
export const Glasses: FC<Readonly<{ look: Look }>> = ({ look }) => (
  <g fill="none" stroke={look.glassesColor} strokeWidth={6}>
    <circle cx={EYES.left} cy={EYES.y} r={42} />
    <circle cx={EYES.right} cy={EYES.y} r={42} />
    <path d="M192,188 C196,180 204,180 208,188" />
    <path d="M110,192 L92,186 M290,192 L308,186" />
  </g>
);

/** Brows: an arched stroke (width and arch are the character's), moved and turned by the expression. */
export const Brows: FC<Readonly<{ face: LiaFace; look: Look }>> = ({ face, look }) => {
  const { peak, ends } = LiaStyleGeometry.browCurve(look.browArch);
  const path = `M${-BROWS.halfWidth},${ends} Q0,${peak} ${BROWS.halfWidth},${ends}`;
  return (
    <g fill="none" stroke={browColor(look.hairColor2)} strokeWidth={look.browWidth} strokeLinecap="round">
      {(['left', 'right'] as const).map((side) => (
        <path key={side} d={path} transform={`translate(${EYES[side]} ${BROWS.y + face.brows[side].y}) rotate(${face.brows[side].angle})`} />
      ))}
    </g>
  );
};
