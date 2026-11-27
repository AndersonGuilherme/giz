import { StageItems } from './StageItems.ts';
import { STAGES, type StageName, type StageState } from './StageState.ts';

/** `problems`: why the script does not pass (the load or check errors, readable); none means it passes. */
export type ScriptFacts = Readonly<{ present: boolean; problems: readonly string[] }>;
/** Whether `output/video.mp4` exists and whether a project file changed after it was rendered. */
export type VideoFacts = Readonly<{ made: boolean; olderThanInputs: boolean }>;
/** What was made from a project that loads: each line's voice, each generated scene's image and the video. */
export type MadeFacts = Readonly<{ voices: StageItems; scenarios: StageItems; video: VideoFacts }>;
/** What a project folder has; `made` only when the project loads (without it, nothing after the script is known). */
export type StageFacts = Readonly<{ idea: boolean; script: ScriptFacts; made?: MadeFacts }>;

/** One stage: its state, the items out of date, not made yet or blocked, and the problems (script errors, blocked items). */
export type StageReport = Readonly<{
  stage: StageName;
  state: StageState;
  stale: readonly string[];
  missing: readonly string[];
  blocked: readonly string[];
  problems: readonly string[];
}>;

type Summary = Readonly<{ state: StageState; items?: StageItems; problems?: readonly string[] }>;
type Rule = (facts: StageFacts) => Summary;

const EMPTY: Summary = { state: 'empty' };

function scriptSummary({ idea, script }: StageFacts): Summary {
  if (!script.present) return { state: idea ? 'ready' : 'empty' };
  return { state: script.problems.length > 0 ? 'stale' : 'done', problems: script.problems };
}

const itemsSummary = (pick: (made: MadeFacts) => StageItems): Rule => ({ made }) => {
  if (!made) return EMPTY;
  const items = pick(made);
  return { state: items.state(), items, problems: items.problems() };
};

// A video rendered before a project file changed, or while a voice or an image is still pending, is out of date.
function videoSummary({ made }: StageFacts): Summary {
  if (!made) return EMPTY;
  if (!made.video.made) return { state: 'ready' };
  const pending = made.voices.state() !== 'done' || made.scenarios.state() !== 'done';
  return { state: pending || made.video.olderThanInputs ? 'stale' : 'done' };
}

const RULES: Readonly<Record<StageName, Rule>> = {
  idea: ({ idea }) => ({ state: idea ? 'done' : 'empty' }),
  script: scriptSummary,
  // The cast is checked when the project loads (every speaker is in it, every rig parameter valid).
  cast: ({ made }) => ({ state: made ? 'done' : 'empty' }),
  scenarios: itemsSummary((made) => made.scenarios),
  voices: itemsSummary((made) => made.voices),
  video: videoSummary,
};

function reportOf(stage: StageName, { state, items = StageItems.NONE, problems = [] }: Summary): StageReport {
  return { stage, state, stale: items.stale(), missing: items.missing(), blocked: items.blocked(), problems };
}

/** The state of every stage of a project, derived from what its folder has (nothing is stored about the stages). */
export class ProjectStages {
  readonly #reports: readonly StageReport[];

  private constructor(reports: readonly StageReport[]) {
    this.#reports = reports;
  }

  static from(facts: StageFacts): ProjectStages {
    return new ProjectStages(STAGES.map((stage) => reportOf(stage, RULES[stage](facts))));
  }

  each(): readonly StageReport[] {
    return this.#reports;
  }

  of(stage: StageName): StageReport {
    return this.#reports.find((report) => report.stage === stage)!;
  }
}
