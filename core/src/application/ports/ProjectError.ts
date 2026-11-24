/** A validation problem: the file, the field path (empty for the whole file) and the message. */
export type Problem = Readonly<{ file: string; path: string; message: string }>;

export function problemLine(problem: Problem): string {
  const local = problem.path ? `${problem.file} › ${problem.path}` : problem.file;
  return `${local}: ${problem.message}`;
}

export class ProjectError extends Error {
  readonly problems: readonly Problem[];

  constructor(problems: readonly Problem[]) {
    super(`projeto inválido:\n${problems.map(problemLine).join('\n')}`);
    this.name = 'ProjectError';
    this.problems = problems;
  }
}
