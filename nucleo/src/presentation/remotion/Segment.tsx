import type { FC } from 'react';
import { Sequence, useCurrentFrame } from 'remotion';
import type { SegmentJson } from '../../domain/timeline/VideoProps.ts';
import { Frame } from '../../domain/values/Time.ts';
import { CaptionView } from '../captions/captionRegistry.tsx';
import type { VideoPlan } from './videoPlan.ts';

type SegmentProps = Readonly<{ segment: SegmentJson; plan: VideoPlan }>;

const SegmentCaption: FC<SegmentProps> = ({ segment, plan }) => {
  const frame = useCurrentFrame();
  const { props, aspect } = plan;
  return (
    <CaptionView style={props.captionStyle} format={props.format} words={segment.words} lineDuration={segment.lineDuration} aspect={aspect} frame={Frame.of(frame)} />
  );
};

/** A line on the video: its caption, from the segment start (moved by the lead-in) for the whole segment. */
export const Segment: FC<SegmentProps> = ({ segment, plan }) => (
  <Sequence from={plan.clock.toVideo(segment.start)} durationInFrames={segment.totalDuration} name={`fala ${segment.lineId}`}>
    <SegmentCaption segment={segment} plan={plan} />
  </Sequence>
);
