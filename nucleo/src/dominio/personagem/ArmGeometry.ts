import type { Pose } from '../elenco/PoseEExpressao.ts';

export type Hand = 'open' | 'fist' | 'index';

/**
 * Angles in degrees, the same for both sides: `shoulder` 0 is the hanging arm and positive opens outward;
 * `elbow` is relative to the upper arm, positive keeps going outward/up and negative bends inward.
 * `foreshortening` in (0, 1] shrinks the upper arm when it comes toward the camera.
 * `inFront` draws the arm over the head.
 */
export type Arm = Readonly<{ shoulder: number; elbow: number; foreshortening: number; hand: Hand; inFront: boolean }>;

/** `right` is the arm on the side the character faces; `headTilt` in degrees. */
export type ArmPose = Readonly<{ left: Arm; right: Arm; headTilt: number }>;

type Extras = Partial<Pick<Arm, 'foreshortening' | 'hand' | 'inFront'>>;

const arm = (shoulder: number, elbow: number, extras: Extras = {}): Arm =>
  ({ shoulder, elbow, foreshortening: 1, hand: 'open', inFront: false, ...extras });

const HANGING = arm(8, -8);

const ARM_POSES: Readonly<Record<Pose, ArmPose>> = {
  neutra: { left: HANGING, right: HANGING, headTilt: 0 },
  explicar: { left: arm(22, -95), right: arm(30, 70), headTilt: 2 },
  apontar: { left: HANGING, right: arm(92, 6, { hand: 'index' }), headTilt: 3 },
  acenar: { left: HANGING, right: arm(120, 45), headTilt: -3 },
  levantar: { left: HANGING, right: arm(140, 22, { hand: 'index', inFront: true }), headTilt: -4 },
  pensar: {
    left: arm(-6, -80, { foreshortening: 0.8 }),
    right: arm(-25, -150, { foreshortening: 0.45, hand: 'fist', inFront: true }),
    headTilt: 6,
  },
  ombros: { left: arm(35, 75), right: arm(35, 75), headTilt: 6 },
  comemorar: { left: arm(120, 40, { hand: 'fist' }), right: arm(120, 40, { hand: 'fist' }), headTilt: 0 },
  'mao-na-cabeca': { left: HANGING, right: arm(110, 83, { inFront: true }), headTilt: -5 },
  'maos-na-boca': {
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
