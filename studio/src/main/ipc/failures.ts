import type { Failure } from '../../shared/contract.ts';
import { StudioError } from '../services/StudioError.ts';
import { translate } from '../text.ts';

// Core's ProjectError carries the problems of an invalid project (file, field and message, already in pt-BR).
type Problem = Readonly<{ file: string; path: string; message: string }>;
const problemLine = (problem: Problem) => `${[problem.file, problem.path].filter(Boolean).join(' › ')}: ${problem.message}`;
const problemsOf = (error: Error): readonly Problem[] | undefined => (error as Error & { problems?: readonly Problem[] }).problems;

/** What the window sees of an error: never a stack trace: the code, a translated message and, in the details, the problems or the raw error text. */
export function failureOf(error: unknown): Failure {
  if (error instanceof StudioError) return { code: error.code, message: error.message, details: error.details, ...(error.path ? { path: error.path } : {}) };
  if (!(error instanceof Error)) return { code: 'failed', message: translate('errors.failed'), details: [String(error)] };
  const problems = problemsOf(error);
  if (problems) return { code: 'invalid-project', message: translate('errors.invalidProject'), details: problems.map(problemLine) };
  return { code: 'failed', message: translate('errors.failed'), details: [error.message] };
}
