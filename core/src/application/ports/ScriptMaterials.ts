import type { Format } from '../../domain/project/Project.ts';
import type { Language } from '../../domain/values/Language.ts';

/** A ready character (`casts/presets/`): what the AI reads about it, and the file copied into the project's `cast/`. */
export type CastPreset = Readonly<{
  id: string;
  name: string;
  personality: string;
  voice: string;
  rig?: string;
  json: Readonly<Record<string, unknown>>;
}>;

/** A ready scenario (`presets/scenes/`): its name, description and the scene JSON to copy. */
export type ScenePreset = Readonly<{ id: string; name: string; description: string; scene: unknown }>;

/** What the AI needs to write a script: the format guide, the presets, the answer schema and the voices. */
export interface ScriptMaterials {
  /** `formats/<format>/guide.<language>.md`. */
  guide(format: Format, language: Language): Promise<string>;
  castPresets(): Promise<readonly CastPreset[]>;
  scenePresets(): Promise<readonly ScenePreset[]>;
  /** The JSON schema of the answer, generated from the real project schemas (never copied by hand). */
  answerReference(): string;
  /** The voice ids of the local voice (Qwen). */
  voices(): readonly string[];
}
