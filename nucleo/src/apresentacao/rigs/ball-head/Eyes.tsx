import type { FC } from 'react';
import type { EyesState } from '../../../dominio/personagem/FaceGeometry.ts';
import { EYES, HEAD } from './measures.ts';
import type { Look } from './parameters.ts';
import { useSvgId } from './svg.ts';

type EyesProps = Readonly<{ eyes: EyesState; look: Look }>;
type Pupil = EyesState['pupil'];
type Ellipse = Readonly<{ cx: number; cy: number; rx: number; ry: number }>;

const PUPIL_COLOR = '#101010';

function eyeEllipse(side: -1 | 1, scale: number): Ellipse {
  return { cx: HEAD.x + side * EYES.spacing, cy: EYES.y, rx: EYES.radiusX * scale, ry: EYES.radiusY * scale };
}

const Pupil: FC<Readonly<{ eye: Ellipse; pupil: Pupil; eyeScale: number }>> = ({ eye, pupil, eyeScale }) => {
  const base = EYES.pupil * eyeScale;
  const radius = base * pupil.scale;
  const { catchlight } = pupil;
  const x = eye.cx + pupil.x * EYES.travel.x * eyeScale;
  const y = eye.cy + 4 + pupil.y * EYES.travel.y * eyeScale;
  return (
    <g>
      <circle cx={x} cy={y} r={radius} fill={PUPIL_COLOR} />
      <circle cx={x + base * catchlight.x} cy={y + base * catchlight.y} r={base * catchlight.radius} fill="#ffffff" />
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

const Eye: FC<EyesProps & Readonly<{ side: -1 | 1 }>> = ({ eyes, look, side }) => {
  const clip = useSvgId('eye');
  const eye = eyeEllipse(side, look.eyeScale);
  const lids = side < 0 ? eyes.left : eyes.right;
  return (
    <g>
      <clipPath id={clip}><ellipse {...eye} /></clipPath>
      <ellipse {...eye} fill="#ffffff" />
      <g clipPath={`url(#${clip})`}>
        <Pupil eye={eye} pupil={eyes.pupil} eyeScale={look.eyeScale} />
        <Lids eye={eye} upper={lids.upper} lower={lids.lower} tilt={-side * lids.tilt} color={look.headColor} />
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
