import type { Pose } from '../cast/PoseAndExpression.ts';
import type { Fps, Frame } from '../values/Time.ts';

export type BodyContext = Readonly<{
  pose: Pose;
  poseStart: Frame;
  speaking: boolean;
  opening: number; // speech volume in this frame, from 0 to 1
  phase: number; // shifts the breathing so two characters do not breathe together
  fps: Fps;
}>;

export type BodyOffset = Readonly<{ y: number; rotation: number; scale: number }>;

type Gesture = (sincePose: number, instant: number) => Readonly<{ y?: number; rotation?: number }>;

// One-off gesture: 0 → 1 → 0 in `duration` seconds, then zero.
function once(sincePose: number, duration: number): number {
  return sincePose < duration ? Math.sin((sincePose / duration) * Math.PI) : 0;
}

const GESTURES: Readonly<Record<Pose, Gesture>> = {
  neutral: () => ({}),
  celebrate: (since) => ({ y: -once(since, 0.5) * 18 }),
  think: (_since, instant) => ({ rotation: 2 + Math.sin(instant * 0.9) * 0.6 }),
  raise: (since) => ({ rotation: once(since, 0.6) * 2 }),
  wave: (since) => ({ rotation: since < 1.6 ? Math.sin(since * 7) * 2 * (1 - since / 1.6) : 0 }),
  explain: (since) => ({ rotation: once(since, 0.6) * 1 }),
  point: (since) => ({ rotation: once(since, 0.5) * 1.5 }),
  shrug: (since) => ({ y: -once(since, 0.4) * 3 }),
  'hand-on-head': (since) => ({ rotation: once(since, 0.5) * 1.5 }),
  'hands-on-mouth': (since) => ({ y: -once(since, 0.3) * 2 }),
};

const BREATH_IN_PIXELS = 2;
const VOLUME_PULL_IN_PIXELS = 5;

/** Restrained motion: light breathing, the body follows the volume slightly and the pose gesture happens once. */
export class Body {
  offsetAt(frame: Frame, context: BodyContext): BodyOffset {
    const instant = frame.value() / context.fps.value();
    const sincePose = frame.minus(context.poseStart).value() / context.fps.value();
    const gesture = GESTURES[context.pose](sincePose, instant);
    const line = this.#speechEffect(instant, context);
    return {
      y: Math.sin(instant * 1.5 + context.phase) * BREATH_IN_PIXELS + line.y + (gesture.y ?? 0),
      rotation: line.rotation + (gesture.rotation ?? 0),
      scale: 1 + line.scale,
    };
  }

  #speechEffect(instant: number, context: BodyContext): BodyOffset {
    if (!context.speaking) return { y: 0, rotation: 0, scale: 0 };
    return {
      y: -context.opening * VOLUME_PULL_IN_PIXELS,
      rotation: Math.sin(instant * 1.3 + context.phase) * 0.6 * context.opening,
      scale: context.opening * 0.006,
    };
  }
}
