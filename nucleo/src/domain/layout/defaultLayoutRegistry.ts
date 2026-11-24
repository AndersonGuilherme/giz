import { registerLessonLayouts } from './lessonLayouts.ts';
import { LayoutRegistry } from './LayoutRegistry.ts';

/** Registry with the layouts of every known scene; each call creates a new registry. */
export function createLayoutRegistry(): LayoutRegistry {
  return registerLessonLayouts(LayoutRegistry.empty());
}
