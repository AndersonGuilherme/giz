import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Motion } from '../../../domain/lesson/Motion.ts';
import { TitleLayout } from '../../../domain/lesson/TitleLayout.ts';
import type { TitleScene } from '../../../domain/script/LessonScenes.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { FittedText } from './FittedText.tsx';
import { LessonFrame } from './LessonFrame.tsx';
import { useSceneClock } from './sceneClock.ts';
import { fadeUp, THEME } from './theme.ts';

const GRADIENT_TEXT = { background: THEME.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } as const;

/** Overline in the brand color, the title in the brand gradient and a muted subtitle. */
export const TitleView: FC<SceneProps<TitleScene>> = (props) => {
  const { frame, fps } = useSceneClock();
  const drawing = TitleLayout.for(props.scene, props.aspect);
  return (
    <LessonFrame props={props}>
      <AbsoluteFill style={fadeUp(Motion.pop(frame, fps))}>
        <FittedText block={drawing.overline} weight={700} style={{ color: THEME.brand, letterSpacing: 1 }} />
        <FittedText block={drawing.title} weight={900} style={GRADIENT_TEXT} />
        {drawing.subtitle && <FittedText block={drawing.subtitle} weight={600} style={{ color: THEME.muted }} />}
      </AbsoluteFill>
    </LessonFrame>
  );
};
