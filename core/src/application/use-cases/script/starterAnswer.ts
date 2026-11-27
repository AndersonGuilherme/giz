import type { Idea } from '../../../domain/idea/Idea.ts';
import { NARRATOR_ID, narratorOf, stagedCharacters, starterTexts, starterTitle } from '../../../domain/idea/starterScript.ts';
import type { Format } from '../../../domain/project/Project.ts';
import type { CastPreset, ScenePreset } from '../../ports/ScriptMaterials.ts';

type Presets = Readonly<{ cast: readonly CastPreset[]; scenes: readonly ScenePreset[] }>;
type SceneStarter = (idea: Idea, context: Readonly<{ presets: Presets; rigged: readonly string[]; title: string }>) => unknown;

const isObject = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === 'object' && value !== null && !Array.isArray(value);

// The first scene asked for: a scene preset is copied, any other name is a vector background (the idea checked it).
function sceneBase(name: string | undefined, scenes: readonly ScenePreset[]): Readonly<Record<string, unknown>> {
  const preset = scenes.find(({ id }) => id === name)?.scene;
  if (isObject(preset)) return preset;
  return { type: 'scenario', background: { vector: name ?? 'room' } };
}

// A story opens on a scenario with the characters that have a body; a lesson opens on its title.
const SCENE_STARTERS: Readonly<Record<Format, SceneStarter>> = {
  story: (idea, { presets, rigged }) => ({ ...sceneBase(idea.sceneNames()[0], presets.scenes), characters: stagedCharacters(rigged, idea.aspect()) }),
  lesson: (_idea, { title }) => ({ type: 'title', overline: '', title }),
};

/** A script to write by hand, in the shape of an AI answer: the chosen cast plus the narrator, one line to replace. */
export function starterAnswer(idea: Idea, presets: Presets): Readonly<{ project: Readonly<{ title: string }>; cast: readonly unknown[]; script: unknown }> {
  const ids = idea.castIds();
  const rigged = ids.filter((id) => presets.cast.find((preset) => preset.id === id)?.rig !== undefined);
  const title = starterTitle(idea.toJson().theme);
  const texts = starterTexts(idea.language());
  const scene = SCENE_STARTERS[idea.format()](idea, { presets, rigged, title });
  const line = { id: '01', chapter: 1, speaker: rigged[0] ?? NARRATOR_ID, text: texts.line, scene };
  const narrator = ids.includes(NARRATOR_ID) ? [] : [narratorOf(idea.language())];
  return { project: { title }, cast: [...ids, ...narrator], script: { chapters: [texts.chapter], lines: [line] } };
}
