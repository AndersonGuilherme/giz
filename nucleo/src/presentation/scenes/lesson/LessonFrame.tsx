import type { FC, ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import type { SceneProps } from '../SceneRegistry.ts';
import { PresentersView } from './PresentersView.tsx';
import { THEME } from './theme.ts';

type LessonFrameProps = Readonly<{ props: SceneProps; onStage?: boolean; children?: ReactNode }>;

/** Every lesson scene: the lesson background, its content and the presenters (beside it, or on the stage in `talk`). */
export const LessonFrame: FC<LessonFrameProps> = ({ props, onStage = false, children }) => (
  <AbsoluteFill style={{ background: THEME.background, overflow: 'hidden' }}>
    {children}
    <PresentersView cast={props.cast} aspect={props.aspect} onStage={onStage} stateOf={props.stateOf} />
  </AbsoluteFill>
);
