import { Timeline } from '../../domain/timeline/Timeline.ts';
import type { VideoProps } from '../../domain/timeline/VideoProps.ts';
import { AspectRatio } from '../../domain/values/AspectRatio.ts';
import { Language } from '../../domain/values/Language.ts';
import { SceneRuns } from '../../domain/video/SceneRuns.ts';
import { SoundTrack } from '../../domain/video/SoundTrack.ts';
import { VideoClock } from '../../domain/video/VideoClock.ts';

/** The domain objects a video needs, made once from its props (the components only ask them). */
export type VideoPlan = Readonly<{
  props: VideoProps;
  clock: VideoClock;
  runs: SceneRuns;
  sounds: SoundTrack;
  timeline: Timeline;
  aspect: AspectRatio;
  language: Language;
}>;

export function videoPlan(props: VideoProps): VideoPlan {
  const clock = VideoClock.of(props.totalFrames);
  return {
    props, clock, runs: SceneRuns.of(props, clock), sounds: SoundTrack.of(props, clock), timeline: Timeline.of(props),
    aspect: AspectRatio.ofSize(props.width, props.height), language: Language.of(props.language),
  };
}
