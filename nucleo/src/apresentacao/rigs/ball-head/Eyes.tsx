import type { FC } from 'react';
import type { Face, Point } from '../../../dominio/personagem/FaceGeometry.ts';
import { EYES, HEAD } from './measures.ts';
import type { Look } from './parameters.ts';
import { useSvgId } from './svg.ts';

type EyesProps = Readonly<{ face: Face; gaze: Point; blink: number; look: Look }>;
type Ellipse = Readonly<{ cx: number; cy: number; rx: number; ry: number }>;

const PUPIL_COLOR = '#101010';

function eyeEllipse(side: -1 | 1, scale: number): Ellipse {
  return { cx: HEAD.x + side * EYES.spacing, cy: EYES.y, rx: EYES.radiusX * scale, ry: EYES.radiusY * scale };
}

const Pupil: FC<Readonly<{ eye: Ellipse; gaze: Point; scale: number }>> = ({ eye, gaze, scale }) => {
  const radius = EYES.pupil * scale;
  const x = eye.cx + gaze.x * EYES.travel.x * (eye.rx / EYES.radiusX);
  const y = eye.cy + 4 + gaze.y * EYES.travel.y * (eye.ry / EYES.radiusY);
  return (
    <g>
      <circle cx={x} cy={y} r={radius} fill={PUPIL_COLOR} />
      <circle cx={x + radius * 0.35} cy={y - radius * 0.4} r={Math.max(2.5, radius * 0.3)} fill="#ffffff" />
    </g>
  );
};

type LidsProps = Readonly<{ eye: Ellipse; upper: number; lower: number; tilt: number; color: string }>;

// Lids are head-colored ellipses: the upper one closes from above (tilted like the brow), the lower one smiles.
const Lids: FC<LidsProps> = ({ eye, upper, lower, tilt, color }) => {
  const top = eye.cy - 2 * eye.ry * (1 - upper) - 1;
  const bottom = eye.cy + 2 * eye.ry * (1 - lower) + 1;
  return (
    <g fill={color}>
      <ellipse cx={eye.cx} cy={top} rx={eye.rx * 1.6} ry={eye.ry + 1} transform={`rotate(${tilt} ${eye.cx} ${eye.cy})`} />
      <ellipse cx={eye.cx} cy={bottom} rx={eye.rx * 1.6} ry={eye.ry} />
    </g>
  );
};

const Eye: FC<EyesProps & Readonly<{ side: -1 | 1 }>> = ({ face, gaze, blink, look, side }) => {
  const clip = useSvgId('eye');
  const eye = eyeEllipse(side, look.eyeScale);
  const tilt = -side * face.brows[side < 0 ? 'left' : 'right'].innerAngle * 0.6;
  return (
    <g>
      <clipPath id={clip}><ellipse {...eye} /></clipPath>
      <ellipse {...eye} fill="#ffffff" />
      <g clipPath={`url(#${clip})`}>
        <Pupil eye={eye} gaze={gaze} scale={face.pupil.scale * look.eyeScale} />
        <Lids eye={eye} upper={Math.max(face.lids.upper, blink)} lower={face.lids.lower} tilt={tilt} color={look.headColor} />
      </g>
    </g>
  );
};

export const Eyes: FC<EyesProps> = (props) => (
  <g>
    <Eye {...props} side={-1} />
    <Eye {...props} side={1} />
  </g>
);

/** Round glasses around the eyes, in the accessory color. */
export const Glasses: FC<Readonly<{ look: Look }>> = ({ look }) => {
  const [left, right] = [eyeEllipse(-1, look.eyeScale), eyeEllipse(1, look.eyeScale)];
  const radius = Math.max(left.rx, left.ry) + 7;
  return (
    <g fill="none" stroke={look.accessoryColor} strokeWidth={7}>
      <circle cx={left.cx} cy={left.cy} r={radius} />
      <circle cx={right.cx} cy={right.cy} r={radius} />
      <path d={`M${left.cx + radius - 6},${left.cy - 8} Q${HEAD.x},${left.cy - 16} ${right.cx - radius + 6},${right.cy - 8}`} />
    </g>
  );
};
