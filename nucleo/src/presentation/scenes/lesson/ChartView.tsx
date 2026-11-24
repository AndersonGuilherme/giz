import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { ChartLayout, type ChartCurve, type ChartDrawing, type Plot } from '../../../domain/lesson/ChartLayout.ts';
import { Motion } from '../../../domain/lesson/Motion.ts';
import type { ChartScene } from '../../../domain/script/LessonScenes.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { FittedText } from './FittedText.tsx';
import { LessonFrame } from './LessonFrame.tsx';
import { Panel } from './Panel.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, THEME } from './theme.ts';

const CURVE_COLORS: Readonly<Record<ChartCurve['kind'], string>> = { healthy: THEME.ok, rotten: THEME.danger };
// The curve label appears when its curve is almost drawn.
const LABEL_AT = 0.9;

const pathOf = (curve: ChartCurve): string => curve.points.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' ');

const Axes: FC<Readonly<{ plot: Plot }>> = ({ plot }) => (
  <path d={`M${plot.left},${plot.top} V${plot.base} H${plot.right}`} fill="none" stroke={THEME.ink} strokeWidth={5} strokeLinecap="round" />
);

const Curve: FC<Readonly<{ curve: ChartCurve; progress: number }>> = ({ curve, progress }) => (
  <path d={pathOf(curve)} fill="none" stroke={CURVE_COLORS[curve.kind]} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress} />
);

const Labels: FC<Readonly<{ drawing: ChartDrawing; progress: readonly number[] }>> = ({ drawing, progress }) => {
  const { yLabel, plot } = drawing;
  return (
    <>
      <FittedText block={drawing.xLabel} weight={700} style={{ color: THEME.muted, textAlign: 'right' }} />
      <FittedText block={yLabel} weight={700} style={{ color: THEME.muted, left: plot.left - 34 - yLabel.lineHeight(), top: plot.base, transformOrigin: 'top left', transform: 'rotate(-90deg)' }} />
      {drawing.curves.map((curve, index) => (
        <FittedText key={curve.kind} block={curve.label} weight={900} style={{ color: CURVE_COLORS[curve.kind], textAlign: 'right', opacity: progress[index]! > LABEL_AT ? 1 : 0 }} />
      ))}
    </>
  );
};

/** The cost-of-change chart: axes with their labels and the curves, the newest drawing itself. */
export const ChartView: FC<SceneProps<ChartScene>> = (props) => {
  const { frame, age, fps } = useSceneClock(props.changedAt);
  const drawing = ChartLayout.for(props.scene, props.aspect, props.language);
  const progress = drawing.curves.map((_curve, index) => ChartLayout.progressOf({ index, count: drawing.curves.length }, age, fps));
  return (
    <LessonFrame props={props}>
      <AbsoluteFill style={fadeUp(Motion.pop(frame, fps))}>
        <Panel rectangle={drawing.panel} />
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <Axes plot={drawing.plot} />
          {drawing.curves.map((curve, index) => <Curve key={curve.kind} curve={curve} progress={progress[index]!} />)}
        </svg>
        <Labels drawing={drawing} progress={progress} />
      </AbsoluteFill>
    </LessonFrame>
  );
};
