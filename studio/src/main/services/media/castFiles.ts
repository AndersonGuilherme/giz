import type { CastMember, CastPreset, CharacterFile, ProjectVoice } from '../../../shared/cast.ts';
import type { MediaCore } from '../../ports/MediaCore.ts';
import type { ProjectDisk } from '../../ports/ProjectDisk.ts';
import { isObject, textOf, type Json, type ScriptLine } from './projectJson.ts';

const LANGUAGES = ['pt-BR', 'en'] as const;
const QWEN = ['0.6b', '1.7b'] as const;
const PROVIDERS = ['qwen', 'recording', 'elevenlabs', 'fish'] as const;

const oneOf = <Value extends string>(options: readonly Value[], value: unknown, fallback: Value): Value =>
  (options as readonly unknown[]).includes(value) ? (value as Value) : fallback;

export const languageOf = (project: Json): 'pt-BR' | 'en' => oneOf(LANGUAGES, project.language, 'pt-BR');

export function projectVoiceOf(project: Json): ProjectVoice {
  const voice = isObject(project.voice) ? project.voice : {};
  const model = voice.model === undefined ? {} : { model: oneOf(QWEN, voice.model, '0.6b') };
  return { provider: oneOf(PROVIDERS, voice.provider, 'qwen'), ...model };
}

// A text field the file has, as `{ field: text }`; nothing when it has none.
const textField = (json: Json, field: string): Json => (typeof json[field] === 'string' ? { [field]: json[field] } : {});
const objectIn = (json: Json, field: string): Json => (isObject(json[field]) ? json[field] : {});

/** A character file in the editor's shape: the fields it knows, with what the file has (a broken file still opens). */
export function characterOf(id: string, json: unknown): CharacterFile {
  const file = isObject(json) ? json : {};
  const voice = objectIn(file, 'voice');
  const parameters = objectIn(file, 'parameters') as CharacterFile['parameters'];
  const optional = { ...textField(file, 'rig'), ...textField(file, 'personality') };
  return { id, name: textOf(file.name) || id, ...optional, parameters, voice: { id: textOf(voice.id), ...textField(voice, 'style') }, defaultExpression: textOf(file.defaultExpression) || 'neutral' };
}

export async function memberOf(source: Readonly<{ disk: ProjectDisk; folder: string }>, id: string, lines: readonly ScriptLine[]): Promise<CastMember> {
  const { disk, folder } = source;
  const said = lines.filter(({ speaker }) => speaker === id).length;
  try {
    return { file: characterOf(id, await disk.readJson(folder, `cast/${id}.json`)), lines: said };
  } catch (error) {
    return { file: characterOf(id, {}), lines: said, problem: error instanceof Error ? error.message : String(error) };
  }
}

/** The ready characters, each with the style of the video's language when it has none (as a new project gets them). */
export async function presetsOf(core: MediaCore, language: 'pt-BR' | 'en'): Promise<readonly CastPreset[]> {
  const [presets, catalog] = await Promise.all([core.presetFiles(), core.catalog()]);
  return presets.map(({ id, name, personality, json }) => {
    const file = characterOf(id, json);
    return { id, name, personality, file: { ...file, voice: { ...file.voice, style: file.voice.style ?? catalog.styles[language] } } };
  });
}

/** The file as saved: only the fields with a value (an empty personality or style is left out). */
export function savedFile(character: CharacterFile): Json {
  const { voice, personality, rig, ...rest } = character;
  const style = voice.style?.trim() ? { style: voice.style.trim() } : {};
  const body = rig ? { rig } : {};
  const about = personality?.trim() ? { personality: personality.trim() } : {};
  return { ...rest, ...body, voice: { id: voice.id, ...style }, ...about };
}
