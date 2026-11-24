import { useCurrentFrame } from 'remotion';
import { Fps } from '../../../domain/values/Time.ts';

/** `frame` from the start of the scene; `age` frames since the last beat that changed it. */
export type SceneClock = Readonly<{ frame: number; age: number; fps: Fps }>;

export function useSceneClock(changedAt = 0): SceneClock {
  const frame = useCurrentFrame();
  return { frame, age: Math.max(0, frame - changedAt), fps: Fps.DEFAULT };
}
