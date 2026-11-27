// The script editor: the document it edits, the problems the check finds and the lists its pickers offer.
import type { StageBrief } from './projects.ts';

/** A line of script.json as the editor keeps it: the known fields, plus any other the file has (kept as they are). */
export type LineJson = Readonly<Record<string, unknown>> & Readonly<{ id: string; chapter: number; speaker: string; text: string }>;
export type ScriptJson = Readonly<{ chapters: readonly string[]; lines: readonly LineJson[] }>;

/** Someone of the cast: `body` false for a voice without a body (the narrator). */
export type EditorCastMember = Readonly<{ id: string; name: string; body: boolean }>;

/** What the editor opens: the project's profile, its cast and its script as JSON (a broken script still opens). */
export type ScriptDocument = Readonly<{
  folder: string;
  title: string;
  format: string;
  aspect: string;
  language: string;
  cast: readonly EditorCastMember[];
  script: ScriptJson;
}>;

/** A problem of the check: `line` is the index of the line (null: the whole project), `field` the line's field, if known. */
export type EditorProblem = Readonly<{ line: number | null; field: string | null; message: string }>;
/** After each save: the check (errors and warnings) and the stages (core's ProjectStages). */
export type EditorReport = Readonly<{ errors: readonly EditorProblem[]; warnings: readonly EditorProblem[]; stages: readonly StageBrief[] }>;

/** One problem of a scene checked alone: the field inside the scene and the message. */
export type SceneProblem = Readonly<{ path: string; message: string }>;

/** The lists the editor's pickers offer, from core's domain. */
export type Vocabulary = Readonly<{
  poses: readonly string[];
  expressions: readonly string[];
  looks: readonly string[];
  sounds: readonly string[];
  sceneTypes: readonly string[];
  backgrounds: readonly string[];
  positions: readonly string[];
  directions: readonly string[];
  cameraMoves: readonly string[];
  effects: readonly string[];
  cardVariants: readonly string[];
  terminalTones: readonly string[];
}>;
