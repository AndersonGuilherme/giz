import type { Fps } from '../values/Time.ts';

// The motor's `pop`: a Remotion spring with mass 0.6, damping 14 and the default stiffness 100, here in closed form
// (an underdamped oscillator released from 0 towards 1), so Node and the video compute the same curve.
const MASS = 0.6;
const DAMPING = 14;
const STIFFNESS = 100;
const NATURAL = Math.sqrt(STIFFNESS / MASS);
const RATIO = DAMPING / (2 * Math.sqrt(STIFFNESS * MASS));
const DAMPED = NATURAL * Math.sqrt(1 - RATIO * RATIO);
const FADE_SHIFT_IN_PIXELS = 24;

export type Fade = Readonly<{ opacity: number; shift: number }>;

/** The entrance curves of the lesson scenes, in frames. */
export class Motion {
  /** 0 before `frame` 0, then a spring that overshoots a hair and settles at 1. */
  static pop(frame: number, fps: Fps): number {
    if (frame <= 0) return 0;
    const time = frame / fps.value();
    const decay = Math.exp(-RATIO * NATURAL * time);
    return 1 - decay * (Math.cos(DAMPED * time) + ((RATIO * NATURAL) / DAMPED) * Math.sin(DAMPED * time));
  }

  /** The motor's `fadeUp`: comes in from 24 px below while it becomes opaque. */
  static fadeUp(progress: number): Fade {
    return { opacity: progress, shift: (1 - progress) * FADE_SHIFT_IN_PIXELS };
  }

  /** 0 before `range[0]`, 1 after `range[1]`, linear in between. */
  static ramp(frame: number, range: readonly [number, number]): number {
    const [start, end] = range;
    return Math.max(0, Math.min(1, (frame - start) / (end - start)));
  }

  static easeInOutCubic(fraction: number): number {
    if (fraction < 0.5) return 4 * fraction ** 3;
    return 1 - (-2 * fraction + 2) ** 3 / 2;
  }
}
