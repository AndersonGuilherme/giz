import type { FC } from 'react';
import { Sequence, useCurrentFrame } from 'remotion';
import type { SegmentJson } from '../../domain/timeline/VideoProps.ts';
import { HoldLabel } from '../../domain/video/HoldLabel.ts';
import { Frame } from '../../domain/values/Time.ts';
import { CaptionView } from '../captions/captionRegistry.tsx';
import { HoldLabelView } from './HoldLabelView.tsx';
import type { VideoPlan } from './videoPlan.ts';

type SegmentProps = Readonly<{ segment: SegmentJson; plan: VideoPlan }>;

// During the hold the label and its countdown take the caption place; the rest of the segment shows the caption.
const SegmentCaption: FC<SegmentProps> = ({ segment, plan }) => {
  const frame = useCurrentFrame();
  const { props, aspect } = plan;
  const secondsLeft = HoldLabel.secondsLeft(segment, frame);
  if (secondsLeft !== undefined && segment.holdAfter) {
    return <HoldLabelView drawing={HoldLabel.for(segment.holdAfter.label, aspect, props.format)} secondsLeft={secondsLeft} />;
  }
  return (
    <CaptionView style={props.captionStyle} format={props.format} words={segment.words} lineDuration={segment.lineDuration} aspect={aspect} frame={Frame.of(frame)} />
  );
};

/** A line on the video: its caption (or its hold label), from the segment start (moved by the lead-in) for the whole segment. */
export const Segment: FC<SegmentProps> = ({ segment, plan }) => (
  <Sequence from={plan.clock.toVideo(segment.start)} durationInFrames={segment.totalDuration} name={`fala ${segment.lineId}`}>
    <SegmentCaption segment={segment} plan={plan} />
  </Sequence>
);
