import { DomainError } from '../../../domain/DomainError.ts';
import type { Project } from '../../../domain/project/Project.ts';
import type { Line } from '../../../domain/script/Line.ts';

/** Empty `line`: the problem belongs to the project (for example, a load warning). */
export type Problem = Readonly<{ line: string; message: string }>;
export type CheckReport = { errors: Problem[]; warnings: Problem[] };

/** A line of the project and whether it is the first of its chapter (the frame shows a new chapter name there). */
export type PlacedLine = Readonly<{ project: Project; line: Line; opensChapter: boolean }>;

/** A rule checked line by line: the messages of that line (none when it is fine). */
export type LineRule = (placed: PlacedLine) => string[];

/** A rule checked once over the whole project: its problems, each naming the line it belongs to. */
export type ProjectRule = (project: Project) => Problem[];

/** A refusal of the domain (too many characters, camera target out of the scene) becomes a message; anything else is a bug. */
export function refusalMessage(error: unknown): string {
  if (error instanceof DomainError) return error.message;
  throw error;
}
