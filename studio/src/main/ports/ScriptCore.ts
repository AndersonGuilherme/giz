import type { TEXT_PROVIDERS } from '../../shared/settings.ts';
import type { IdeaFields, Portraits, Presets, ScriptEstimate, StageBrief } from '../../shared/projects.ts';
import type { SceneProblem, Vocabulary } from '../../shared/script.ts';

export type TextProviderName = (typeof TEXT_PROVIDERS)[number];

/**
 * One problem the check found: a field of a file (`file`, `path`: an invalid project, from the schemas) or a line
 * (`lineId`: core's check, by line id); neither for the whole project.
 */
export type ValidationProblem = Readonly<{ file?: string; path?: string; lineId?: string; message: string }>;
export type Validation = Readonly<{ errors: readonly ValidationProblem[]; warnings: readonly ValidationProblem[] }>;

/** `key`: the text AI key, read by the main process (absent in rehearsal mode); `onCall` before each call (1 of 4...). */
export type GenerationJob = Readonly<{
  folder: string;
  provider: TextProviderName;
  key?: string;
  signal: AbortSignal;
  onCall: (call: number, most: number) => void;
}>;
export type Generation = Readonly<{ repairs: number; calls: number }>;

/** The text AI did not reach a valid script: the last problems and where its last answer was kept. */
export class GenerationFailure extends Error {
  readonly problems: readonly string[];
  readonly draft: string;

  constructor(problems: readonly string[], draft: string) {
    super('the text AI did not reach a valid script');
    this.name = 'GenerationFailure';
    this.problems = problems;
    this.draft = draft;
  }
}

/** Core's script stage as the Studio uses it: stages, validation, a project from an idea, presets and the scene check. */
export interface ScriptCore {
  stages(folder: string): Promise<readonly StageBrief[]>;
  /** Loads and checks the project: the schema problems when it does not load, otherwise the check's. */
  validate(folder: string): Promise<Validation>;
  /** A project to write by hand: the chosen cast, a narrator and a first line. */
  start(idea: IdeaFields, folder: string): Promise<void>;
  presets(): Promise<Presets>;
  /** The portraits of the ready characters with a body, drawn into (and kept in) `folder`. */
  portraits(folder: string): Promise<Portraits>;
  estimate(idea: IdeaFields, provider: TextProviderName): Promise<ScriptEstimate>;
  /** Throws a GenerationFailure when the AI never reached a valid script; an AbortError when cancelled. */
  generate(idea: IdeaFields, job: GenerationJob): Promise<Generation>;
  vocabulary(): Promise<Vocabulary>;
  checkScene(scene: unknown): Promise<readonly SceneProblem[]>;
}
