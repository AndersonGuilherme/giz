import type { Problem } from '../../application/ports/ProjectError.ts';
import type { RigCatalog } from '../../application/ports/RigCatalog.ts';
import { characterSchema } from './characterSchema.ts';
import { ProblemCollector } from './errorMessages.ts';
import { requiredRigPresent, rigParameters } from './rigParameters.ts';

const FILE = 'character';

/**
 * The problems of one character file on its own, as loading a project finds them (the Studio's cast editor checks
 * before saving): the schema, then the rig and each parameter against the rig catalog. None when it is valid.
 */
export function characterProblems(json: unknown, catalog: RigCatalog): readonly Problem[] {
  const collector = new ProblemCollector();
  const result = characterSchema.safeParse(json, { reportInput: true });
  if (!result.success) {
    collector.addFromZod(FILE, result.error.issues);
    return collector.problems();
  }
  const source = { file: FILE, collector };
  if (requiredRigPresent(result.data, source)) rigParameters(result.data, catalog, source);
  return collector.problems();
}
