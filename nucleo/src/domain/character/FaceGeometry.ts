import type { Expression } from '../cast/PoseAndExpression.ts';
import type { Gaze } from '../script/Line.ts';

/** Negative `height` raises; positive `innerAngle` lowers the inner end (angry), negative raises it (worried). */
export type Brow = Readonly<{ height: number; innerAngle: number }>;
/** Silent mouth: positive `curve` smiles; `opening` > 0 opens; `tilt` skews it; `wave` makes it wavy. */
export type MouthShape = Readonly<{ width: number; curve: number; opening: number; tilt: number; wave: number }>;
export type Point = Readonly<{ x: number; y: number }>;

/** Everything in face units (head radius = 100); lids go from 0 (open) to 1 (closed). */
export type Face = Readonly<{
  brows: Readonly<{ left: Brow; right: Brow }>;
  lids: Readonly<{ upper: number; lower: number }>;
  pupil: Readonly<{ scale: number; offset: Point }>;
  mouth: MouthShape;
  sweat: boolean;
}>;

const pair = (height: number, innerAngle: number) => {
  const brow = { height, innerAngle };
  return { left: brow, right: brow };
};
const mouth = (width: number, curve: number, rest: Partial<MouthShape> = {}): MouthShape =>
  ({ width, curve, opening: 0, tilt: 0, wave: 0, ...rest });
const lids = (upper: number, lower: number) => ({ upper, lower });
const CENTER: Point = { x: 0, y: 0 };
const pupil = (scale: number, offset: Point = CENTER) => ({ scale, offset });

const FACES: Readonly<Record<Expression, Face>> = {
  neutral: { brows: pair(0, 0), lids: lids(0.08, 0), pupil: pupil(1), mouth: mouth(26, 5), sweat: false },
  happy: { brows: pair(-6, -5), lids: lids(0, 0.3), pupil: pupil(1), mouth: mouth(34, 12, { opening: 9 }), sweat: false },
  excited: { brows: pair(-15, -8), lids: lids(0, 0.12), pupil: pupil(1.12), mouth: mouth(40, 14, { opening: 22 }), sweat: false },
  surprised: { brows: pair(-24, 0), lids: lids(0, 0), pupil: pupil(0.7), mouth: mouth(18, 0, { opening: 18 }), sweat: false },
  confused: {
    brows: { left: { height: -18, innerAngle: -10 }, right: { height: 3, innerAngle: 12 } },
    lids: lids(0.12, 0), pupil: pupil(0.9, { x: 0.3, y: -0.3 }), mouth: mouth(26, 0, { wave: 5, tilt: 3 }), sweat: false,
  },
  thinking: {
    brows: { left: { height: -10, innerAngle: -6 }, right: { height: 0, innerAngle: 8 } },
    lids: lids(0.3, 0), pupil: pupil(0.9, { x: 0.55, y: -0.7 }), mouth: mouth(16, -1, { tilt: 4 }), sweat: false,
  },
  skeptical: {
    brows: { left: { height: 6, innerAngle: 14 }, right: { height: -16, innerAngle: 4 } },
    lids: lids(0.42, 0.12), pupil: pupil(0.85, { x: 0.35, y: 0 }), mouth: mouth(28, 3, { tilt: 8 }), sweat: false,
  },
  worried: { brows: pair(-10, -18), lids: lids(0.1, 0), pupil: pupil(0.9), mouth: mouth(26, -7, { wave: 2 }), sweat: true },
  angry: { brows: pair(6, 22), lids: lids(0.28, 0.1), pupil: pupil(0.85), mouth: mouth(34, -6, { opening: 6 }), sweat: false },
  scared: { brows: pair(-20, -16), lids: lids(0, 0), pupil: pupil(0.55), mouth: mouth(30, -10, { opening: 22 }), sweat: true },
};

// Where the pupil goes (-1 to 1); positive `x` is the side the character faces.
const GAZES: Readonly<Record<Gaze, Point>> = {
  camera: CENTER,
  other: { x: 1, y: 0 },
  content: { x: 0.75, y: -0.35 },
};

/** Upper and lower lid (0 open to 1 closed) and the upper lid's tilt in degrees (positive lowers the inner end). */
export type Lids = Readonly<{ upper: number; lower: number; tilt: number }>;
/** Final pupil position (-1 to 1, positive x toward the facing side) and size, plus each eye's lids. */
/** Catchlight in units of the base pupil radius, relative to the pupil center. */
export type Catchlight = Readonly<{ radius: number; x: number; y: number }>;
export type EyesState = Readonly<{ pupil: Readonly<{ x: number; y: number; scale: number; catchlight: Catchlight }>; left: Lids; right: Lids }>;

const LID_TILT_PER_BROW_ANGLE = 0.6;
const MINIMUM_CATCHLIGHT = 0.18; // a tiny scared pupil still keeps a visible highlight

const catchlightOf = (scale: number): Catchlight =>
  ({ radius: Math.max(MINIMUM_CATCHLIGHT, 0.3 * scale), x: 0.35 * scale, y: -0.4 * scale });
const clamp = (value: number) => Math.max(-1, Math.min(1, value));

function lidsOf(face: Face, brow: Brow, blink: number): Lids {
  return { upper: Math.max(face.lids.upper, blink), lower: face.lids.lower, tilt: brow.innerAngle * LID_TILT_PER_BROW_ANGLE };
}

export class FaceGeometry {
  static for(expression: Expression): Face {
    return FACES[expression];
  }

  static gaze(gaze: Gaze): Point {
    return GAZES[gaze];
  }

  /** The gaze plus the expression's pupil offset (clamped); a blink closes over the expression's lids. */
  static eyes(expression: Expression, gaze: Gaze, blink: number): EyesState {
    const face = FACES[expression];
    const target = GAZES[gaze];
    const { scale } = face.pupil;
    const pupil = { x: clamp(target.x + face.pupil.offset.x), y: clamp(target.y + face.pupil.offset.y), scale, catchlight: catchlightOf(scale) };
    return { pupil, left: lidsOf(face, face.brows.left, blink), right: lidsOf(face, face.brows.right, blink) };
  }
}
