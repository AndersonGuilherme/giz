import { defaultVoiceStyle } from '../../../domain/cast/voiceStyles.ts';
import { DomainError } from '../../../domain/DomainError.ts';
import type { Idea } from '../../../domain/idea/Idea.ts';
import { CharacterId } from '../../../domain/values/CharacterId.ts';
import type { ProjectVoice } from '../../../domain/project/Project.ts';
import type { CastFile, ProjectFiles } from '../../ports/ProjectFolder.ts';
import type { CastPreset } from '../../ports/ScriptMaterials.ts';

/** What turns an answer into project files: the idea, the presets the answer may name and the project voice. */
export type DraftContext = Readonly<{ idea: Idea; presets: readonly CastPreset[]; voice: ProjectVoice }>;
/** The project files of an answer, or the problems that kept it from being one. */
export type Draft = Readonly<{ files?: ProjectFiles; problems: readonly string[] }>;

type Answer = Readonly<{ project: Readonly<Record<string, unknown>>; cast: readonly unknown[]; script: unknown }>;
type CastEntry = Readonly<{ file?: CastFile; problem?: string }>;

const isObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Models sometimes wrap the JSON in a ```json fence or in a sentence even when asked not to: the object is what goes
// from the first "{" to the last "}".
export function jsonText(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start >= 0 && end > start ? text.slice(start, end + 1) : text.trim();
}

function parsed(text: string): unknown {
  try {
    return JSON.parse(jsonText(text));
  } catch (error) {
    return new Error(`a resposta não é um JSON válido (${(error as Error).message})`);
  }
}

function answerProblems(json: unknown): string[] {
  if (json instanceof Error) return [json.message];
  if (!isObject(json)) return ['a resposta precisa ser um objeto JSON com "project", "cast" e "script"'];
  const missing = [isObject(json.project) ? '' : '"project" (objeto)', Array.isArray(json.cast) ? '' : '"cast" (lista)', 'script' in json ? '' : '"script"'];
  return missing.filter(Boolean).map((field) => `a resposta precisa do campo ${field}`);
}

// The id names the file cast/<id>.json: it must be a valid character id before it gets near a path.
function refusal(error: unknown): string {
  if (error instanceof DomainError) return error.message;
  throw error;
}

function idProblem(id: string): string | undefined {
  try {
    CharacterId.of(id);
    return undefined;
  } catch (error) {
    return refusal(error);
  }
}

// A preset without a voice style gets the project language's default (the presets are written for any language).
function presetFile(preset: CastPreset, context: DraftContext): CastFile {
  const voice = (isObject(preset.json.voice) ? preset.json.voice : {}) as Readonly<Record<string, unknown>>;
  const style = voice.style ?? defaultVoiceStyle(context.idea.language());
  return { ...preset.json, id: preset.id, voice: { ...voice, style } };
}

function newCharacter(entry: Readonly<Record<string, unknown>>, index: number): CastEntry {
  if (typeof entry.id !== 'string') return { problem: `cast[${index}].id: obrigatório (um texto)` };
  const problem = idProblem(entry.id);
  return problem ? { problem: `cast[${index}].id: ${problem}` } : { file: entry as CastFile };
}

function castEntry(entry: unknown, index: number, context: DraftContext): CastEntry {
  const preset = context.presets.find((candidate) => candidate.id === entry);
  if (preset) return { file: presetFile(preset, context) };
  if (typeof entry === 'string') return { problem: `cast[${index}]: personagem pronto "${entry}" não existe (use um id da lista de personagens prontos ou defina o personagem inteiro)` };
  if (isObject(entry)) return newCharacter(entry, index);
  return { problem: `cast[${index}]: use o id de um personagem pronto ou um personagem completo com "id"` };
}

function castProblems(files: readonly CastFile[], idea: Idea): string[] {
  const ids = files.map(({ id }) => id);
  const repeated = ids.filter((id, index) => ids.indexOf(id) < index).map((id) => `cast: o personagem "${id}" aparece duas vezes`);
  const left = idea.castIds().filter((id) => !ids.includes(id)).map((id) => `cast: a ideia pede o personagem "${id}", que ficou de fora`);
  return [...repeated, ...left];
}

function projectJson(answer: Answer, context: DraftContext, cast: readonly CastFile[]): Readonly<Record<string, unknown>> {
  const { idea, voice } = context;
  const { title, captionStyle } = answer.project;
  const profile = { format: idea.format(), language: idea.language().code(), aspect: idea.aspect().text() };
  const style = captionStyle === undefined ? {} : { captionStyle };
  return { version: 2, title, ...profile, ...style, cast: cast.map(({ id }) => id), voice };
}

/** The answer of the AI as project files: the project fields from the idea, the named presets copied, the script as it came. */
export function draftOf(text: string, context: DraftContext): Draft {
  const json = parsed(text);
  const problems = answerProblems(json);
  if (problems.length > 0) return { problems };
  const answer = json as Answer;
  const entries = answer.cast.map((entry, index) => castEntry(entry, index, context));
  const cast = entries.flatMap(({ file }) => (file ? [file] : []));
  const all = [...entries.flatMap(({ problem }) => (problem ? [problem] : [])), ...castProblems(cast, context.idea)];
  if (all.length > 0) return { problems: all };
  const files = { idea: context.idea.toJson(), project: projectJson(answer, context, cast), script: answer.script, cast };
  return { files, problems: [] };
}
