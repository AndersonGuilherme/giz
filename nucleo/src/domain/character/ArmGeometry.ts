import type { Pose } from '../cast/PoseAndExpression.ts';

export type Hand = 'open' | 'fist' | 'index';

/**
 * Angles in degrees, the same for both sides: `shoulder` 0 is the hanging arm and positive opens outward;
 * `elbow` is relative to the upper arm, positive keeps going outward/up and negative bends inward.
 * `foreshortening` in (0, 1] shrinks the upper arm when it comes toward the camera.
 * `inFront` draws the arm over the head; `wrist` bends the hand outward (degrees).
 */
export type Arm = Readonly<{ shoulder: number; elbow: number; foreshortening: number; hand: Hand; inFront: boolean; wrist: number }>;

/** `right` is the arm on the side the character faces; `headTilt` in degrees. */
export type ArmPose = Readonly<{ left: Arm; right: Arm; headTilt: number }>;

type Extras = Partial<Pick<Arm, 'foreshortening' | 'hand' | 'inFront' | 'wrist'>>;

const arm = (shoulder: number, elbow: number, extras: Extras = {}): Arm =>
  ({ shoulder, elbow, foreshortening: 1, hand: 'open', inFront: false, wrist: 0, ...extras });

const HANGING = arm(8, -8);

const ARM_POSES: Readonly<Record<Pose, ArmPose>> = {
  neutral: { left: HANGING, right: HANGING, headTilt: 0 },
  explain: { left: arm(22, -95), right: arm(30, 70), headTilt: 2 },
  point: { left: HANGING, right: arm(92, 6, { hand: 'index' }), headTilt: 3 },
  wave: { left: HANGING, right: arm(95, 60, { wrist: 30 }), headTilt: -3 },
  // "Wait a moment": upper arm stays down, the forearm stands up and shows the open palm at chest height.
  raise: { left: HANGING, right: arm(30, 140), headTilt: -4 },
  think: {
    left: arm(-6, -80, { foreshortening: 0.8 }),
    right: arm(-25, -150, { foreshortening: 0.45, hand: 'fist', inFront: true }),
    headTilt: 6,
  },
  shrug: { left: arm(35, 75), right: arm(35, 75), headTilt: 6 },
  celebrate: { left: arm(120, 40, { hand: 'fist' }), right: arm(120, 40, { hand: 'fist' }), headTilt: 0 },
  'hand-on-head': { left: HANGING, right: arm(110, 83, { inFront: true }), headTilt: -5 },
  'hands-on-mouth': {
    left: arm(0, -160, { foreshortening: 0.15, inFront: true }),
    right: arm(0, -160, { foreshortening: 0.15, inFront: true }),
    headTilt: 0,
  },
};

export class ArmGeometry {
  static for(pose: Pose): ArmPose {
    return ARM_POSES[pose];
  }
}
