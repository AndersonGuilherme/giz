import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Motion } from '../../../domain/lesson/Motion.ts';
import { VersusLayout, type VersusSide } from '../../../domain/lesson/VersusLayout.ts';
import type { VersusScene } from '../../../domain/script/LessonScenes.ts';
import type { Fps } from '../../../domain/values/Time.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { TEXT_FONT } from '../fonts.ts';
import { FittedText } from './FittedText.tsx';
import { LessonFrame } from './LessonFrame.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, placed, THEME } from './theme.ts';

const LOOKS = { wrong: { color: THEME.danger, mark: '✕' }, right: { color: THEME.ok, mark: '✓' } } as const;

const Side: FC<Readonly<{ side: VersusSide; frame: number; fps: Fps }>> = ({ side, frame, fps }) => {
  const look = LOOKS[side.side];
  return (
    <div style={{ position: 'absolute', inset: 0, ...fadeUp(Motion.pop(frame - side.delay, fps)) }}>
      <div style={{ ...placed(side.panel), borderRadius: 36, background: THEME.card, boxShadow: THEME.shadow, border: `5px solid ${look.color}` }} />
      <div style={{ ...placed(side.icon), borderRadius: side.icon.width / 2, background: look.color, color: '#fff', display: 'grid', placeItems: 'center', font: `900 ${side.icon.width * 0.62}px ${TEXT_FONT}` }}>{look.mark}</div>
      <FittedText block={side.title} weight={900} style={{ color: THEME.ink }} />
      <FittedText block={side.text} weight={600} style={{ color: THEME.muted }} />
    </div>
  );
};

/** Wrong × right: the wrong panel first, the right one 20 frames later. */
export const VersusView: FC<SceneProps<VersusScene>> = (props) => {
  const { frame, fps } = useSceneClock();
  const { sides } = VersusLayout.for(props.scene, props.aspect);
  return (
    <LessonFrame props={props}>
      <AbsoluteFill>
        {sides.map((side) => <Side key={side.side} side={side} frame={frame} fps={fps} />)}
      </AbsoluteFill>
    </LessonFrame>
  );
};
