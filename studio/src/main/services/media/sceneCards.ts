import type { GeneratedState, ImageStyle, SceneBackground, SceneCard } from '../../../shared/scenarios.ts';
import { IMAGE_STYLES } from '../../../shared/scenarios.ts';
import type { StageItems } from '../../ports/MediaCore.ts';
import { isObject, textOf, type Json, type ScriptLine } from './projectJson.ts';

/** A scenario scene of the script: the line that declares it and where it is. */
export type ScenarioLine = Readonly<{ line: ScriptLine; number: number; background: Json }>;
/** How a card shows a file: its URL (null when missing) and, for a picture, whether its shape is the video's. */
export type FileView = Readonly<{ url: (file: string) => Promise<string | null>; aspectWarning: (file: string) => Promise<string | undefined> }>;

export const generatedFile = (lineId: string): string => `scenes/${lineId}.png`;

/** Every line with its own scenario scene (a line without a scene goes on with the scene before it). */
export function scenarioLines(lines: readonly ScriptLine[]): ScenarioLine[] {
  return lines.flatMap((line, index) => {
    const scene = isObject(line.scene) ? line.scene : undefined;
    if (scene?.type !== 'scenario') return [];
    return [{ line, number: index + 1, background: isObject(scene.background) ? scene.background : {} }];
  });
}

const STATES: ReadonlyArray<readonly [keyof StageItems['scenarios'], GeneratedState]> = [['blocked', 'blocked'], ['stale', 'stale'], ['missing', 'missing']];

function stateOf(lineId: string, items: StageItems['scenarios']): GeneratedState {
  const found = STATES.find(([list]) => items[list].includes(lineId));
  return found ? found[1] : 'done';
}

function generateOf(background: Json): SceneCard['generate'] {
  if (!isObject(background.generate)) return undefined;
  const style = (IMAGE_STYLES as readonly unknown[]).includes(background.generate.style) ? { style: background.generate.style as ImageStyle } : {};
  return { prompt: textOf(background.generate.prompt), ...style };
}

async function backgroundOf(scene: ScenarioLine, view: FileView): Promise<SceneBackground> {
  const image = textOf(scene.background.image);
  if (!image) return { kind: 'vector', vector: textOf(scene.background.vector) || 'room', colors: (isObject(scene.background.colors) ? scene.background.colors : {}) as Record<string, string> };
  const own = image !== generatedFile(scene.line.id);
  const warning = await view.aspectWarning(image);
  return { kind: 'image', image, url: await view.url(image), own, ...(warning ? { aspectWarning: warning } : {}) };
}

/** One card: what the scene shows, its prompt, the image giz made for it and that image's state (stages, item by item). */
export async function cardOf(scene: ScenarioLine, items: StageItems['scenarios'], view: FileView): Promise<SceneCard> {
  const { line, number } = scene;
  const generate = generateOf(scene.background);
  const problem = items.problems.find((text) => text.includes(`fala ${line.id}:`));
  const extra = generate ? { generate, state: stateOf(line.id, items), ...(problem ? { problem } : {}) } : {};
  return { lineId: line.id, number, text: line.text, background: await backgroundOf(scene, view), generated: await view.url(generatedFile(line.id)), ...extra };
}

/** The script with one line's scene background replaced (every other field kept as it is). */
export function withBackground(script: Json & Readonly<{ lines: readonly ScriptLine[] }>, lineId: string, change: (background: Json) => Json): Json {
  const lines = script.lines.map((line) => {
    if (line.id !== lineId || !isObject(line.scene)) return line;
    const background = isObject(line.scene.background) ? line.scene.background : {};
    return { ...line, scene: { ...line.scene, background: change(background) } };
  });
  return { ...script, lines };
}

/** A background without some of its fields. */
export function without(background: Json, ...fields: readonly string[]): Json {
  return Object.fromEntries(Object.entries(background).filter(([field]) => !fields.includes(field)));
}
