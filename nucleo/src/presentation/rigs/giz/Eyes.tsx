import type { FC } from 'react';
import type { EyesState } from '../../../domain/character/FaceGeometry.ts';
import { EYES, HEAD } from './measures.ts';
import { skinOf, type Look } from './parameters.ts';
import { shade, useSvgId } from '../svg.ts';

type EyesProps = Readonly<{ eyes: EyesState; look: Look }>;
type Pupil = EyesState['pupil'];
/** The eye's rounded rectangle, by its center and half sizes. */
type EyeBox = Readonly<{ cx: number; cy: number; halfWidth: number; halfHeight: number; corner: number }>;

const PUPIL_COLOR = '#17110e';
const WHITE = '#fbf8f1';

function eyeBox(side: -1 | 1, scale: number): EyeBox {
  return { cx: HEAD.x + side * EYES.spacing, cy: EYES.y, halfWidth: (EYES.width / 2) * scale, halfHeight: (EYES.height / 2) * scale, corner: EYES.corner * scale };
}

const Sclera: FC<Readonly<{ eye: EyeBox; fill: string; stroke?: string }>> = ({ eye, fill, stroke }) => (
  <rect
    x={eye.cx - eye.halfWidth} y={eye.cy - eye.halfHeight} width={2 * eye.halfWidth} height={2 * eye.halfHeight} rx={eye.corner}
    fill={fill} stroke={stroke} strokeWidth={stroke ? 3.5 : 0}
  />
);

// Colored iris with a darker rim, the pupil (its size carries the emotion) and two highlights.
const Iris: FC<Readonly<{ eye: EyeBox; pupil: Pupil; look: Look }>> = ({ eye, pupil, look }) => {
  const scale = look.eyeScale;
  const [iris, base] = [EYES.iris * scale, EYES.pupil * scale];
  const x = eye.cx + pupil.x * EYES.travel.x * scale;
  const y = eye.cy + 3 + pupil.y * EYES.travel.y * scale;
  const { catchlight } = pupil;
  return (
    <g>
      <circle cx={x} cy={y} r={iris} fill={look.eyeColor} stroke={shade(look.eyeColor, -0.35)} strokeWidth={3} />
      <circle cx={x} cy={y} r={base * pupil.scale} fill={PUPIL_COLOR} />
      <circle cx={x + iris * 0.42} cy={y - iris * 0.42} r={Math.max(3, base * catchlight.radius * 1.6)} fill="#ffffff" />
      <circle cx={x - iris * 0.38} cy={y + iris * 0.4} r={2.2 * scale} fill="#ffffff" opacity={0.8} />
    </g>
  );
};

type LidsProps = Readonly<{ eye: EyeBox; upper: number; lower: number; tilt: number; color: string }>;

// Lids are skin-colored ellipses: the upper one closes from above (tilted like the brow), the lower one smiles.
const Lids: FC<LidsProps> = ({ eye, upper, lower, tilt, color }) => {
  const top = eye.cy - 2 * eye.halfHeight * (1 - upper) - 1;
  const bottom = eye.cy + 2 * eye.halfHeight * (1 - lower) + 1;
  return (
    <g fill={color}>
      <ellipse cx={eye.cx} cy={top} rx={eye.halfWidth * 1.7} ry={eye.halfHeight + 1} transform={`rotate(${tilt} ${eye.cx} ${eye.cy})`} />
      <ellipse cx={eye.cx} cy={bottom} rx={eye.halfWidth * 1.7} ry={eye.halfHeight} />
    </g>
  );
};

const Eye: FC<EyesProps & Readonly<{ side: -1 | 1 }>> = ({ eyes, look, side }) => {
  const clip = useSvgId('eye');
  const eye = eyeBox(side, look.eyeScale);
  const lids = side < 0 ? eyes.left : eyes.right;
  const skin = skinOf(look);
  return (
    <g>
      <clipPath id={clip}><Sclera eye={eye} fill="#000000" /></clipPath>
      <Sclera eye={eye} fill={WHITE} />
      <g clipPath={`url(#${clip})`}>
        <Iris eye={eye} pupil={eyes.pupil} look={look} />
        <Lids eye={eye} upper={lids.upper} lower={lids.lower} tilt={-side * lids.tilt} color={skin.base} />
      </g>
      <Sclera eye={eye} fill="none" stroke={skin.line} />
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
  const [left, right] = [eyeBox(-1, look.eyeScale), eyeBox(1, look.eyeScale)];
  const radius = Math.max(left.halfWidth, left.halfHeight) + 8;
  return (
    <g fill="none" stroke={look.accessoryColor} strokeWidth={7}>
      <circle cx={left.cx} cy={left.cy} r={radius} />
      <circle cx={right.cx} cy={right.cy} r={radius} />
      <path d={`M${left.cx + radius - 6},${left.cy - 8} Q${HEAD.x},${left.cy - 16} ${right.cx - radius + 6},${right.cy - 8}`} />
    </g>
  );
};
