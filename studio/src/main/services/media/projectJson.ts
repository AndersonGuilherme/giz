import type { ProjectDisk } from '../../ports/ProjectDisk.ts';
import { translate } from '../../text.ts';
import { StudioError } from '../StudioError.ts';

export type Json = Readonly<Record<string, unknown>>;
export type ScriptLine = Json & Readonly<{ id: string; speaker: string; text: string }>;

export const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
export const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');
// An id names a file (cast/<id>.json, scenes/<id>.png, recordings/<id>.wav): only a plain name, never a path.
export const PLAIN_ID = /^[a-z0-9][a-z0-9_-]*$/i;

export async function projectOf(disk: ProjectDisk, folder: string): Promise<Json> {
  const json = await disk.readJson(folder, 'project.json');
  if (!isObject(json)) throw new StudioError('invalid-project', translate('errors.fileNotJson', { file: 'project.json' }));
  return json;
}

/** The script as it is on disk (a broken one gives no lines); every line keeps the fields the file has. */
export async function scriptOf(disk: ProjectDisk, folder: string): Promise<Json & Readonly<{ lines: readonly ScriptLine[] }>> {
  const json = await disk.readJson(folder, 'script.json').catch(() => ({}));
  const script = isObject(json) ? json : {};
  const lines = (Array.isArray(script.lines) ? script.lines : []).filter(isObject) as unknown as ScriptLine[];
  return { ...script, lines: lines.filter((line) => typeof line.id === 'string') };
}

/** The cast ids of project.json that can name a file. */
export const castIdsOf = (project: Json): string[] => (Array.isArray(project.cast) ? project.cast.map(textOf).filter((id) => PLAIN_ID.test(id)) : []);

/** Refuses an id that is not a line of the script (before anything is written). */
export function lineIn(lines: readonly ScriptLine[], lineId: string): ScriptLine {
  const line = lines.find(({ id }) => id === lineId);
  if (!line || !PLAIN_ID.test(lineId)) throw new StudioError('invalid-request', translate('media.noSuchLine', { line: lineId }));
  return line;
}
