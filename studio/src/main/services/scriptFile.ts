import { parseJson } from '../../shared/jsonText.ts';
import type { ScriptJson } from '../../shared/script.ts';
import type { ProjectDisk } from '../ports/ProjectDisk.ts';
import { translate } from '../text.ts';
import { StudioError } from './StudioError.ts';

type Json = Readonly<Record<string, unknown>>;

export const SCRIPT_FILE = 'script.json';
const EMPTY_SCRIPT: ScriptJson = { chapters: [], lines: [] };
const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');

function parsed(text: string): unknown {
  const { value, problem } = parseJson(text);
  if (!problem) return value;
  const place = problem.line === undefined ? translate('errors.jsonBroken') : translate('errors.jsonBrokenAt', { line: problem.line, column: problem.column ?? 1 });
  throw new StudioError('invalid-project', translate('errors.scriptUnreadable'), [`${SCRIPT_FILE}: ${place}`]);
}

function shaped(json: unknown): ScriptJson {
  if (!isObject(json) || !Array.isArray(json.lines)) throw new StudioError('invalid-project', translate('errors.scriptUnreadable'), [translate('errors.scriptShape')]);
  const chapters = Array.isArray(json.chapters) ? json.chapters.map(textOf) : [];
  return { chapters, lines: json.lines.filter(isObject) as unknown as ScriptJson['lines'] };
}

/**
 * The project's script as the editor can edit it: none yet is an empty script; a file that exists but is not a script
 * (broken JSON, another shape) is a readable failure, never an empty script an edit would save over.
 */
export async function scriptIn(disk: ProjectDisk, folder: string): Promise<ScriptJson> {
  const text = await disk.readText(folder, SCRIPT_FILE);
  return text === undefined ? EMPTY_SCRIPT : shaped(parsed(text));
}
