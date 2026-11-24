import { scenarioBoxes } from '../../domain/layout/scenarioLayout.ts';
import { ScenarioView } from './scenario/ScenarioView.tsx';
import { SceneRegistry } from './SceneRegistry.ts';

/** Every scene the video knows how to draw (Remotion bundle only: it loads `.tsx`). Task 13 registers the lesson scenes. */
export const sceneRegistry = SceneRegistry.empty().register('scenario', { Component: ScenarioView, boxes: scenarioBoxes });
