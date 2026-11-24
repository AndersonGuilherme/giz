import type { Project } from '../../domain/project/Project.ts';
import type { Line } from '../../domain/script/Line.ts';
import type { CheckReport, LineRule, Problem, ProjectRule } from './check/CheckRule.ts';
import { layoutRule, type LayoutDependencies } from './check/layoutRule.ts';
import type { RigCatalog } from '../ports/RigCatalog.ts';
import { presenterFrameRule, scenarioFrameRule } from './check/characterRules.ts';
import { beatRule, firstSceneRule, presenterRule } from './check/scriptRules.ts';

export type { CheckReport, Problem } from './check/CheckRule.ts';

/** `rigs`: where each character draws and how high it reaches (the characters' frame warnings). */
type Dependencies = LayoutDependencies & Readonly<{ rigs: RigCatalog }>;
type Rules = Readonly<Record<'projectErrors' | 'projectWarnings', readonly ProjectRule[]> & Record<'lineErrors' | 'lineWarnings', readonly LineRule[]>>;

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
    const { rigs } = dependencies;
    this.#rules = {
      projectErrors: [firstSceneRule, presenterRule],
      lineErrors: [layoutRule(dependencies), beatRule],
      projectWarnings: [presenterFrameRule(rigs)],
      lineWarnings: [scenarioFrameRule(rigs)],
    };
  }

  run(project: Project): CheckReport {
    const { projectErrors, lineErrors, projectWarnings, lineWarnings } = this.#rules;
    const errors = [...projectErrors.flatMap((rule) => rule(project)), ...lineProblems(project, lineErrors)];
    const loadWarnings = project.warnings().map((message) => ({ line: '', message }));
    const warnings = [...loadWarnings, ...projectWarnings.flatMap((rule) => rule(project)), ...lineProblems(project, lineWarnings)];
    return { errors, warnings };
  }
}
