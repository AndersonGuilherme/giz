import { scenarioBoxes } from '../../domain/layout/scenarioLayout.ts';
import { registerLessonScenes } from './lesson/lessonScenes.ts';
import { ScenarioView } from './scenario/ScenarioView.tsx';
import { SceneRegistry } from './SceneRegistry.ts';

/** Every scene the video knows how to draw (Remotion bundle only: it loads `.tsx`). */
export const sceneRegistry = registerLessonScenes(SceneRegistry.empty().register('scenario', { Component: ScenarioView, boxes: scenarioBoxes }));
