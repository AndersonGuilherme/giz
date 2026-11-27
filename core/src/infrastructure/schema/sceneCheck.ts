import type { Problem } from '../../application/ports/ProjectError.ts';
import { ProblemCollector } from './errorMessages.ts';
import { lessonSceneSchemas } from './lessonSceneSchemas.ts';
import { sceneSchema } from './sceneSchema.ts';

/** Every scene `type`, read from the scene schemas: `scenario` and the lesson scenes. */
export const SCENE_TYPES: readonly string[] = ['scenario', ...lessonSceneSchemas.map((schema) => schema.shape.type.value)];

/**
 * The problems of one scene on its own, as the script schema finds them (the Studio's scene editor checks as you type);
 * the paths start at the scene (`background.vector`). Whether its characters are in the cast is the project check's job.
 */
export function sceneProblems(scene: unknown): readonly Problem[] {
  const result = sceneSchema.safeParse(scene, { reportInput: true });
  if (result.success) return [];
  const collector = new ProblemCollector();
  collector.addFromZod('scene', result.error.issues);
  return collector.problems();
}
