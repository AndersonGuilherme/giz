import type { IdeaJson } from '../../domain/idea/Idea.ts';
import type { ProjectVoice } from '../../domain/project/Project.ts';

/** One character file, `cast/<id>.json`. */
export type CastFile = Readonly<{ id: string } & Record<string, unknown>>;

/** The files of a project folder, as JSON: `idea.json`, `project.json`, `script.json` and `cast/`. */
export type ProjectFiles = Readonly<{
  idea: IdeaJson;
  project: Readonly<Record<string, unknown>>;
  script: unknown;
  cast: readonly CastFile[];
}>;

/** The last answer of a generation that never became valid, and its problems. */
export type FailedDraft = Readonly<{ answer: string; problems: readonly string[] }>;

/** Reads and writes the project folders the AI creates. */
export interface ProjectFolder {
  /** The stored `idea.json`, as JSON (the Idea validates it); a readable error when it is missing or not JSON. */
  readIdea(folder: string): Promise<unknown>;
  /** The `voice` of the folder's `project.json`, to keep it when the script is regenerated; undefined without one. */
  storedVoice(folder: string): Promise<ProjectVoice | undefined>;
  /** Writes the files to a scratch folder, runs `use` on it and removes it (the draft never touches the project). */
  staged<T>(files: ProjectFiles, use: (folder: string) => Promise<T>): Promise<T>;
  /** Writes the files into the project folder (creating it), replacing the ones with the same name. */
  save(folder: string, files: ProjectFiles): Promise<void>;
  /** Keeps a failed draft next to the project folder, never inside it, and returns where it went. */
  keepFailed(folder: string, draft: FailedDraft): Promise<string>;
}
