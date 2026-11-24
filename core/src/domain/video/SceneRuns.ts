import { Beats } from '../timeline/Beats.ts';
import type { ResolvedScene, SegmentJson, VideoProps } from '../timeline/VideoProps.ts';
import type { VideoClock } from './VideoClock.ts';

/** Consecutive segments on the same scene (same `sceneKey`), in video frames: the scene component lives this long. */
export type SceneRun = Readonly<{ key: number; from: number; duration: number; segments: readonly SegmentJson[] }>;

/**
 * A scene in a frame: the fields with the beats up to that frame, `changedAt` (frame from the run start of the last beat
 * that changed a scene field; 0 when none did), `progress` (0 at the run start, 1 at its last frame) and the timeline
 * frame (for the character states) and the chapter of the segment on screen.
 */
export type SceneOnScreen = Readonly<{ scene: ResolvedScene; changedAt: number; progress: number; timelineFrame: number; chapter: number }>;

function groupByKey(segments: readonly SegmentJson[]): SegmentJson[][] {
  return segments.reduce<SegmentJson[][]>((groups, segment) => {
    const last = groups.at(-1);
    if (last && last[0]!.sceneKey === segment.sceneKey) return [...groups.slice(0, -1), [...last, segment]];
    return [...groups, [segment]];
  }, []);
}

// The segment that contains the timeline frame; after the end of the run, its last one.
function segmentAt(run: SceneRun, timelineFrame: number): SegmentJson {
  const found = run.segments.find((segment) => timelineFrame < segment.start + segment.totalDuration);
  return found ?? run.segments.at(-1)!;
}

function lastChange(segment: SegmentJson, timelineFrame: number): number | undefined {
  const beats = Beats.fromJson(segment.beats);
  const relative = beats.lastSceneChangeUntil(timelineFrame - segment.start);
  return relative === undefined ? undefined : segment.start + relative;
}

/** The scenes of the video, one after the other: the first takes the lead-in, the last one the tail. */
export class SceneRuns {
  readonly #runs: readonly SceneRun[];
  readonly #clock: VideoClock;

  private constructor(runs: readonly SceneRun[], clock: VideoClock) {
    this.#runs = runs;
    this.#clock = clock;
  }

  static of(props: VideoProps, clock: VideoClock): SceneRuns {
    const groups = groupByKey(props.segments);
    const runs = groups.map((segments, index) => {
      const from = index === 0 ? 0 : clock.toVideo(segments[0]!.start);
      const last = segments.at(-1)!;
      const to = index === groups.length - 1 ? clock.durationInFrames() : clock.toVideo(last.start + last.totalDuration);
      return { key: segments[0]!.sceneKey, from, duration: to - from, segments };
    });
    return new SceneRuns(runs, clock);
  }

  each(): readonly SceneRun[] {
    return this.#runs;
  }

  /** The scene of `run` in `frame` (counted from the run start, as its component sees it). */
  sceneAt(run: SceneRun, frame: number): SceneOnScreen {
    const timelineFrame = this.#clock.toTimeline(run.from + frame);
    const segment = segmentAt(run, timelineFrame);
    const beats = Beats.fromJson(segment.beats);
    const scene = beats.appliedUntil(segment.scene, timelineFrame - segment.start);
    const progress = run.duration > 1 ? frame / (run.duration - 1) : 0;
    return { scene, changedAt: this.#changedAt(run, timelineFrame), progress, timelineFrame, chapter: segment.chapter };
  }

  // The beats of the run's segments up to the frame; the changes of an earlier segment carry on (its scene was inherited).
  #changedAt(run: SceneRun, timelineFrame: number): number {
    const changes = run.segments.flatMap((segment) => lastChange(segment, timelineFrame) ?? []);
    const last = changes.at(-1);
    return last === undefined ? 0 : Math.max(0, this.#clock.toVideo(last) - run.from);
  }
}
