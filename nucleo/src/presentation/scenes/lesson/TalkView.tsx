import type { FC } from 'react';
import type { TalkScene } from '../../../domain/script/LessonScenes.ts';
import type { SceneProps } from '../SceneRegistry.ts';
import { LessonFrame } from './LessonFrame.tsx';

/** No content: the presenters take the stage. */
export const TalkView: FC<SceneProps<TalkScene>> = (props) => <LessonFrame props={props} onStage />;
