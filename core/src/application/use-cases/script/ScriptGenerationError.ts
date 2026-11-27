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

  constructor(rounds: number, problems: readonly string[]) {
    const list = shownProblems(problems).map((problem) => `- ${problem}`);
    super([`a IA não chegou a um roteiro válido depois de ${rounds} rodada(s) de correção. Problemas da última resposta:`, ...list].join('\n'));
    this.name = 'ScriptGenerationError';
    this.problems = problems;
  }
}
