import { Fps, Seconds } from '../values/Time.ts';

// The timeline starts on the first word and ends 0.35 s after the last one: without a margin the video opens mid-breath
// and cuts right after the last word. The motor had a 1.5 s silent opening and a 1 s tail; a short video keeps the hook
// close to the start, so only half a second goes before it.
const LEAD_IN_SECONDS = 0.5;
const TAIL_SECONDS = 1;

const toFrames = (seconds: number): number => Seconds.of(seconds).toFrames(Fps.DEFAULT).value();

/** Video frames versus timeline frames: the video is the timeline with a still lead-in before it and a tail after it. */
export class VideoClock {
  readonly #leadIn: number;
  readonly #timelineFrames: number;

  private constructor(leadIn: number, timelineFrames: number) {
    this.#leadIn = leadIn;
    this.#timelineFrames = timelineFrames;
  }

  static of(timelineFrames: number): VideoClock {
    return new VideoClock(toFrames(LEAD_IN_SECONDS), timelineFrames);
  }

  leadIn(): number {
    return this.#leadIn;
  }

  durationInFrames(): number {
    return this.#leadIn + this.#timelineFrames + toFrames(TAIL_SECONDS);
  }

  /** Where a timeline frame (a segment start, a sound) lands in the video. */
  toVideo(timelineFrame: number): number {
    return timelineFrame + this.#leadIn;
  }

  /** The timeline frame shown in a video frame: the first one during the lead-in; after the end, the timeline keeps going. */
  toTimeline(videoFrame: number): number {
    return Math.max(0, videoFrame - this.#leadIn);
  }
}
