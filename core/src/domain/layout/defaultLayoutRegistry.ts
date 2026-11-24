import { registerLessonLayouts } from './lessonLayouts.ts';
import { LayoutRegistry } from './LayoutRegistry.ts';
import { registerScenarioLayout } from './scenarioLayout.ts';

/** Registry with the layouts of every known scene; each call creates a new registry. */
export function createLayoutRegistry(): LayoutRegistry {
  return registerScenarioLayout(registerLessonLayouts(LayoutRegistry.empty()));
}
