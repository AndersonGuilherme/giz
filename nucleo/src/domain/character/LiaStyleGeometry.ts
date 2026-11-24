import type { Expression, Pose } from '../cast/PoseAndExpression.ts';
import type { Gaze } from '../script/Line.ts';
import { FaceGeometry, type Point } from './FaceGeometry.ts';

/**
 * The lia-style rig, ported from the old motor (`motor/src/Character.tsx`). Units are that drawing's (400 × 600,
 * head radius ≈ 115). Arm angles are the motor's SVG rotations in degrees on top of each shoulder's rest angle:
 * the left arm opens outward with positive angles, the right one with negative; `elbow` is relative to the upper arm.
 */
export type LiaArm = Readonly<{ shoulder: number; elbow: number; inFront: boolean }>;
/** `headTilt` turns the head around the neck, `lean` the whole body around the feet (degrees). */
export type LiaPose = Readonly<{ left: LiaArm; right: LiaArm; headTilt: number; lean: number }>;

/** Named silent mouths: the motor's eight plus `grit` (angry) and `gasp` (scared). */
export type LiaMouthShape = 'smile' | 'grin' | 'big' | 'o' | 'wavy' | 'flat' | 'smirk' | 'frown' | 'grit' | 'gasp';
/** `y` positive lowers the brow; `angle` in degrees, positive turns clockwise (lowers the left brow's inner end). */
export type LiaBrow = Readonly<{ y: number; angle: number }>;
/** Lids from 0 (open) to 1 (closed); `eyeDrop` moves the pupils vertically (negative = up). */
export type LiaFace = Readonly<{
  brows: Readonly<{ left: LiaBrow; right: LiaBrow }>;
  lids: Readonly<{ upper: number; lower: number }>;
  eyeDrop: number;
  mouth: LiaMouthShape;
}>;
/** Pupil offset (positive x = the facing side), how far the face features turn that way, the lids and the lid line. */
export type LiaEyes = Readonly<{ pupil: Point; faceTurn: number; upper: number; lower: number; lidLine: boolean }>;

type Angles = readonly [number, number, number, number, number, number];

// [left shoulder, left elbow, right shoulder, right elbow, head, body lean]; the first eight are the motor's POSES.
const ANGLES: Readonly<Record<Pose, Angles>> = {
  neutral: [4, -10, -4, 10, 0, 0],
  explain: [24, 62, -24, -62, 0, 0],
  point: [6, -12, -78, -18, 3, 1.5],
  wave: [4, -10, -100, -55, -3, 0],
  raise: [4, -10, -30, -100, -3, 0], // hand at chest height ("wait a moment"), not stretched up
  think: [10, -14, 32, 122, 6, 0],
  shrug: [26, 50, -26, -50, 5, 0],
  celebrate: [58, 34, -58, -34, 0, 0], // arms open, without euphoria
  // The short arms reach the side of the head: the upper arm goes above the shoulder, the hand lands by the ear.
  'hand-on-head': [4, -10, -122, -40, -5, 0],
  // Both upper arms cross the chest and the forearms stand up, the two hands meeting over the mouth.
  'hands-on-mouth': [-92, -92, 92, 92, 0, 0],
};

const IN_FRONT: Readonly<Record<'left' | 'right', readonly Pose[]>> = {
  left: ['celebrate', 'hands-on-mouth'],
  right: ['wave', 'raise', 'think', 'celebrate', 'hand-on-head', 'hands-on-mouth'],
};

type Quad = readonly [number, number, number, number];
type RawFace = readonly [brows: Quad, lids: readonly [number, number], eyeDrop: number, mouth: LiaMouthShape];

// brows [left y, left angle, right y, right angle] · lids [upper, lower] · eye drop · silent mouth.
// The first eight are the motor's EXPRESSIONS (its `concerned` is `worried`).
const RAW_FACES: Readonly<Record<Expression, RawFace>> = {
  neutral: [[0, 0, 0, 0], [0.08, 0], 0, 'smile'],
  happy: [[-5, 0, -5, 0], [0, 0.22], 0, 'grin'],
  excited: [[-8, 0, -8, 0], [0, 0.18], 0, 'grin'],
  surprised: [[-17, 0, -17, 0], [0, 0], 0, 'o'],
  confused: [[-12, 0, 3, -10], [0.1, 0], 0, 'wavy'],
  thinking: [[-6, 0, 2, -8], [0.3, 0], -6, 'flat'],
  skeptical: [[4, 7, -11, 6], [0.38, 0.1], 0, 'smirk'],
  worried: [[-6, -12, -6, 12], [0.1, 0], 0, 'frown'],
  angry: [[6, 14, 6, -14], [0.3, 0.12], 0, 'grit'],
  scared: [[-15, -14, -15, 14], [0, 0], 0, 'gasp'],
};

function faceOf([brows, lids, eyeDrop, mouth]: RawFace): LiaFace {
  return {
    brows: { left: { y: brows[0], angle: brows[1] }, right: { y: brows[2], angle: brows[3] } },
    lids: { upper: lids[0], lower: lids[1] },
    eyeDrop,
    mouth,
  };
}

// The motor moves the pupils 7 units toward the target and turns the face features 0.9 of that.
const EYE_TRAVEL = 7;
const FACE_TURN = 0.9;
// A lid line marks the upper lid only once it covers enough of the eye to read as a lid.
const LID_LINE_FROM = 0.15;
// The brow ends drop 0.3 of the arch.
const BROW_ENDS = 0.3;

export class LiaStyleGeometry {
  static pose(pose: Pose): LiaPose {
    const [leftShoulder, leftElbow, rightShoulder, rightElbow, headTilt, lean] = ANGLES[pose];
    return {
      left: { shoulder: leftShoulder, elbow: leftElbow, inFront: IN_FRONT.left.includes(pose) },
      right: { shoulder: rightShoulder, elbow: rightElbow, inFront: IN_FRONT.right.includes(pose) },
      headTilt,
      lean,
    };
  }

  static face(expression: Expression): LiaFace {
    return faceOf(RAW_FACES[expression]);
  }

  /** The gaze target plus the expression's eye drop; a blink closes over the expression's upper lid. */
  static eyes(expression: Expression, gaze: Gaze, blink: number): LiaEyes {
    const { lids, eyeDrop } = LiaStyleGeometry.face(expression);
    const target = FaceGeometry.gaze(gaze);
    const upper = Math.max(lids.upper, blink);
    const pupil = { x: target.x * EYE_TRAVEL, y: target.y * EYE_TRAVEL + eyeDrop };
    return { pupil, faceTurn: pupil.x * FACE_TURN, upper, lower: lids.lower, lidLine: upper > LID_LINE_FROM };
  }

  /** The brow is a curve from end to end through a middle control point; `arch` is the character's parameter. */
  static browCurve(arch: number): Readonly<{ peak: number; ends: number }> {
    return { peak: -arch, ends: arch * BROW_ENDS };
  }
}
