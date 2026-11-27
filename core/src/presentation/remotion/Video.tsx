import { useMemo, type FC } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, type CalculateMetadataFunction } from 'remotion';
import type { VideoProps } from '../../domain/timeline/VideoProps.ts';
import { CharacterId } from '../../domain/values/CharacterId.ts';
import { Frame } from '../../domain/values/Time.ts';
import { OverlayLayout } from '../../domain/video/OverlayLayout.ts';
import type { SceneRun } from '../../domain/video/SceneRuns.ts';
import { VideoClock } from '../../domain/video/VideoClock.ts';
import { sceneRegistry } from '../scenes/scenes.ts';
import { Overlay } from './Overlay.tsx';
import { Segment } from './Segment.tsx';
import { Sounds } from './Sounds.tsx';
import { useBundledFonts } from './bundledFonts.ts';
import { videoPlan, type VideoPlan } from './videoPlan.ts';

/** Size, fps and length come from the props: the timeline plus the lead-in and the tail of `VideoClock`. */
export const videoMetadata: CalculateMetadataFunction<VideoProps> = ({ props }) => {
  const clock = VideoClock.of(props.totalFrames);
  return { width: props.width, height: props.height, fps: props.fps, durationInFrames: clock.durationInFrames() };
};

// One scene for as long as it stays on screen: the frame counts from its start, the beats change it at their frames.
const SceneOnScreenView: FC<Readonly<{ run: SceneRun; plan: VideoPlan }>> = ({ run, plan }) => {
  const onScreen = plan.runs.sceneAt(run, useCurrentFrame());
  const { Component } = sceneRegistry.get(onScreen.scene.type);
  const stateOf = (characterId: string) => plan.timeline.stateOf(CharacterId.of(characterId), Frame.of(onScreen.timelineFrame));
  const { scene, progress, changedAt } = onScreen;
  return (
    <>
      <Component scene={scene} aspect={plan.aspect} language={plan.language} progress={progress} changedAt={changedAt} cast={plan.props.cast} stateOf={stateOf} />
      <Overlay drawing={OverlayLayout.forVideo(plan.props, onScreen)} />
    </>
  );
};

/** The whole video: the scenes one after the other, the frame, each line caption, the voices and the sound effects. */
export const Video: FC<VideoProps> = (props) => {
  useBundledFonts();
  const plan = useMemo(() => videoPlan(props), [props]);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {plan.runs.each().map((run) => (
        <Sequence key={run.key} from={run.from} durationInFrames={run.duration} name={`cena ${run.key}`}>
          <SceneOnScreenView run={run} plan={plan} />
        </Sequence>
      ))}
      {props.segments.map((segment) => <Segment key={segment.lineId} segment={segment} plan={plan} />)}
      <Sounds cues={[...plan.sounds.voices(), ...plan.sounds.effects()]} />
    </AbsoluteFill>
  );
};
