import type { Validation, ValidationProblem } from '../ports/ScriptCore.ts';
import type { CoreComposition } from './coreModules.ts';

type Problem = Readonly<{ file: string; path: string; message: string }>;
const problemsOf = (error: unknown): readonly Problem[] | undefined => (error as { problems?: readonly Problem[] } | null)?.problems;
const byLine = ({ line, message }: Readonly<{ line: string; message: string }>): ValidationProblem => (line ? { lineId: line, message } : { message });

/** Loads and checks a project with core: an invalid project gives its schema problems, a valid one the check's. */
export async function validationOf(folder: string, composition: CoreComposition): Promise<Validation> {
  const loaded = await composition.projectRepository().load(folder).catch((error: unknown) => error);
  const problems = problemsOf(loaded);
  if (problems) return { errors: problems.map(({ file, path, message }) => ({ file, path, message })), warnings: [] };
  if (loaded instanceof Error) throw loaded;
  const project = loaded as Awaited<ReturnType<ReturnType<CoreComposition['projectRepository']>['load']>>;
  const report = await composition.checkProject().run(project);
  const warnings = [...project.warnings().map((message) => ({ message })), ...report.warnings.map(byLine)];
  return { errors: report.errors.map(byLine), warnings };
}
