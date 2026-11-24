import type { SoundEffect } from '../script/Line.ts';
import type { SoundEffectJson, SegmentJson, VideoProps } from '../timeline/VideoProps.ts';
import { Fps, Seconds } from '../values/Time.ts';
import type { VideoClock } from './VideoClock.ts';

/** A sound placed in the video: the file (relative to the public folder), its first frame, how long it plays and its volume. */
export type SoundCue = Readonly<{ file: string; from: number; duration: number; volume: number }>;

// The motor volumes (`motor/src/Lesson.tsx`): the effects stay under the voice.
const EFFECT_VOLUMES: Readonly<Record<SoundEffect, number>> = { pop: 0.35, whoosh: 0.18, ding: 0.3, dings: 0.28, error: 0.32, success: 0.3, tick: 0.25 };
const EFFECT_SECONDS = 3;
const VOICE_VOLUME = 1;

/** The files of the sound effects, copied from `motor/assets/sfx` with the same names as the script sounds. */
export const soundFile = (sound: SoundEffect): string => `sounds/${sound}.wav`;

/** What the video plays: the voice of each segment and the sound effects, in video frames. */
export class SoundTrack {
  readonly #props: VideoProps;
  readonly #clock: VideoClock;

  private constructor(props: VideoProps, clock: VideoClock) {
    this.#props = props;
    this.#clock = clock;
  }

  static of(props: VideoProps, clock: VideoClock): SoundTrack {
    return new SoundTrack(props, clock);
  }

  voices(): SoundCue[] {
    return this.#props.segments.flatMap((segment) => this.#voice(segment));
  }

  /** Each effect plays for up to 3 s, never past the end of the video. */
  effects(): SoundCue[] {
    return this.#props.soundEffects.map((effect) => this.#effect(effect));
  }

  #voice(segment: SegmentJson): SoundCue[] {
    if (!segment.audio) return [];
    return [{ file: segment.audio, from: this.#clock.toVideo(segment.start), duration: segment.totalDuration, volume: VOICE_VOLUME }];
  }

  #effect({ frame, sound }: SoundEffectJson): SoundCue {
    const from = this.#clock.toVideo(frame);
    const longest = Seconds.of(EFFECT_SECONDS).toFrames(Fps.DEFAULT).value();
    const duration = Math.max(1, Math.min(longest, this.#clock.durationInFrames() - from));
    return { file: soundFile(sound), from, duration, volume: EFFECT_VOLUMES[sound] };
  }
}
