import type { Project } from '../../domain/project/Project.ts';
import type { Line } from '../../domain/script/Line.ts';
import type { CheckReport, LineRule, Problem, ProjectRule } from './check/CheckRule.ts';
import { layoutRule, type LayoutDependencies } from './check/layoutRule.ts';
import { beatRule, firstSceneRule, presenterRule } from './check/scriptRules.ts';

export type { CheckReport, Problem } from './check/CheckRule.ts';

type Dependencies = LayoutDependencies;
type Rules = Readonly<{ projectErrors: readonly ProjectRule[]; lineErrors: readonly LineRule[] }>;

function chapterNumber(line: Line): number {
  const chapter = line.chapter();
  return chapter.number();
}

function sameChapter(previous: Line | undefined, line: Line): boolean {
  return previous !== undefined && chapterNumber(previous) === chapterNumber(line);
}

// Every line through every line rule, each message tagged with the line id.
function lineProblems(project: Project, rules: readonly LineRule[]): Problem[] {
  const script = project.script();
  const lines = script.lines().each();
  return lines.flatMap((line, index) => {
    const placed = { project, line, opensChapter: !sameChapter(lines[index - 1], line) };
    return rules.flatMap((rule) => rule(placed)).map((message) => ({ line: line.id(), message }));
  });
}

/** Runs the project and line rules and gathers their problems; the rules themselves live in `check/`. */
export class CheckProject {
  readonly #rules: Rules;

  constructor(dependencies: Dependencies) {
    this.#rules = { projectErrors: [firstSceneRule, presenterRule], lineErrors: [layoutRule(dependencies), beatRule] };
  }

  run(project: Project): CheckReport {
    const { projectErrors, lineErrors } = this.#rules;
    const errors = [...projectErrors.flatMap((rule) => rule(project)), ...lineProblems(project, lineErrors)];
    const warnings = project.warnings().map((message) => ({ line: '', message }));
    return { errors, warnings };
  }
}
