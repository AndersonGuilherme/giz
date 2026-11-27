import type { SceneCard } from '../../../shared/scenarios.ts';
import type { ProjectDisk } from '../../ports/ProjectDisk.ts';
import { isObject, type Json } from './projectJson.ts';
import { generateOf } from './sceneCards.ts';

/** Where the Studio keeps the prompts of scenes switched to a vector (the image AI no longer makes them). */
const KEPT_PROMPTS = 'scenes/prompts.json';
export type KeptPrompt = NonNullable<SceneCard['generate']>;
export type KeptPrompts = ReadonlyMap<string, KeptPrompt>;

/** The prompts kept per line (none when the file is missing or broken). */
export async function keptPromptsOf(disk: ProjectDisk, folder: string): Promise<KeptPrompts> {
  const json = await disk.readJson(folder, KEPT_PROMPTS).catch(() => ({}));
  const entries = Object.entries(isObject(json) ? json : {}).flatMap(([lineId, kept]) => {
    const prompt = isObject(kept) ? generateOf({ generate: kept }) : undefined;
    return prompt ? [[lineId, prompt] as const] : [];
  });
  return new Map(entries);
}

/** Keeps the line's `background.generate` (when it has one) before a vector replaces it. */
export async function keepPrompt(disk: ProjectDisk, folder: string, line: Readonly<{ lineId: string; background: Json }>): Promise<void> {
  const prompt = generateOf(line.background);
  if (!prompt) return;
  const kept = await keptPromptsOf(disk, folder);
  await disk.writeJson(folder, KEPT_PROMPTS, Object.fromEntries([...kept, [line.lineId, prompt]]));
}
