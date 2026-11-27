// The validation messages sent back to the AI and shown to the person stop here: a long list says nothing more.
const MAX_SHOWN = 30;

/** The most problems of a list worth showing, with a count of the rest. */
export function shownProblems(problems: readonly string[]): string[] {
  const rest = problems.length - MAX_SHOWN;
  return rest > 0 ? [...problems.slice(0, MAX_SHOWN), `(e mais ${rest} problema(s))`] : [...problems];
}

/** The AI did not reach a valid script within the repair rounds; the message lists the last problems, in pt-BR. */
export class ScriptGenerationError extends Error {
  readonly problems: readonly string[];
  readonly draft: string;

  /** `draft`: where the last answer and its problems were kept (the project folder is left untouched). */
  constructor(rounds: number, failure: Readonly<{ problems: readonly string[]; draft: string }>) {
    const list = shownProblems(failure.problems).map((problem) => `- ${problem}`);
    const header = `a IA não chegou a um roteiro válido depois de ${rounds} rodada(s) de correção. Problemas da última resposta:`;
    const footer = `a última resposta e a lista de problemas ficaram em ${failure.draft}; a pasta do projeto não foi alterada`;
    super([header, ...list, footer].join('\n'));
    this.name = 'ScriptGenerationError';
    this.problems = failure.problems;
    this.draft = failure.draft;
  }
}
