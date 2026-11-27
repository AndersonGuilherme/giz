import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { CastPreset, ScenePreset, ScriptMaterials } from '../../../application/ports/ScriptMaterials.ts';
import type { Format } from '../../../domain/project/Project.ts';
import type { Language } from '../../../domain/values/Language.ts';
import { QWEN_VOICES } from '../../voice/qwen/qwenModels.ts';
import { answerReference } from './answerSchema.ts';

/** `formats/` (the guides), the folders of ready characters and `presets/scenes/`. */
export type MaterialFolders = Readonly<{ formats: string; casts: readonly string[]; scenes: string }>;

type Json = Readonly<Record<string, unknown>>;

const textOf = (value: unknown) => (typeof value === 'string' ? value : '');

async function jsonFiles(folder: string): Promise<{ id: string; json: Json }[]> {
  const files = (await readdir(folder)).filter((file) => file.endsWith('.json')).sort();
  return Promise.all(files.map(async (file) => ({ id: basename(file, '.json'), json: JSON.parse(await readFile(join(folder, file), 'utf8')) as Json })));
}

function castPreset({ id, json }: { id: string; json: Json }): CastPreset {
  const voice = (json.voice ?? {}) as Json;
  const rig = typeof json.rig === 'string' ? { rig: json.rig } : {};
  return { id, name: textOf(json.name), personality: textOf(json.personality), voice: textOf(voice.id), ...rig, json };
}

const scenePreset = ({ id, json }: { id: string; json: Json }): ScenePreset =>
  ({ id, name: textOf(json.name), description: textOf(json.description), scene: json.scene });

/** The guides, presets and answer schema the package ships, read from its folders. */
export class DiskScriptMaterials implements ScriptMaterials {
  readonly #folders: MaterialFolders;

  constructor(folders: MaterialFolders) {
    this.#folders = folders;
  }

  async guide(format: Format, language: Language): Promise<string> {
    const file = join(this.#folders.formats, format, `guide.${language.code()}.md`);
    return (await readFile(file, 'utf8')).trim();
  }

  async castPresets(): Promise<readonly CastPreset[]> {
    const folders = await Promise.all(this.#folders.casts.map(jsonFiles));
    return folders.flat().map(castPreset);
  }

  async scenePresets(): Promise<readonly ScenePreset[]> {
    return (await jsonFiles(this.#folders.scenes)).map(scenePreset);
  }

  answerReference(): string {
    return answerReference();
  }

  voices(): readonly string[] {
    return QWEN_VOICES;
  }
}
