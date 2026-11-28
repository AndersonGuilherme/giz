import { join } from 'node:path';
import type { GeneratedState, ImageCrop, ImageStyle, SceneBackground, SceneCard } from '../../../shared/scenarios.ts';
import { IMAGE_STYLES } from '../../../shared/scenarios.ts';
import type { MediaCore, MediaFiles, StageItems } from '../../ports/MediaCore.ts';
import { translate } from '../../text.ts';
import { StudioError } from '../StudioError.ts';
import { mediaUrlOf } from './mediaUrls.ts';
import { isObject, lineIn, textOf, type Json, type ScriptLine } from './projectJson.ts';

/** A scenario scene of the script: the line that declares it and where it is. */
export type ScenarioLine = Readonly<{ line: ScriptLine; number: number; background: Json }>;
/**
 * How a card shows a file: its URL (null when missing) and, for a picture, whether its shape is the video's; `kept`:
 * the prompt kept for a line switched to a vector.
 */
export type FileView = Readonly<{
  url: (file: string) => Promise<string | null>;
  /** `framed`: the person chose the part shown, so another shape is said as such (nothing unexpected is cut). */
  aspectWarning: (file: string, framed: boolean) => Promise<string | undefined>;
  kept: (lineId: string) => SceneCard['generate'];
}>;

export const generatedFile = (lineId: string): string => `scenes/${lineId}.png`;
/** Where the person's own picture of a scene is kept (a line id is a plain name: two lines never share a file). */
export const ownFile = (lineId: string, format: 'png' | 'jpeg' | 'webp'): string => `scenes/own/${lineId}.${format === 'jpeg' ? 'jpg' : format}`;

/** Every line with its own scenario scene (a line without a scene goes on with the scene before it). */
export function scenarioLines(lines: readonly ScriptLine[]): ScenarioLine[] {
  return lines.flatMap((line, index) => {
    const scene = isObject(line.scene) ? line.scene : undefined;
    if (scene?.type !== 'scenario') return [];
    return [{ line, number: index + 1, background: isObject(scene.background) ? scene.background : {} }];
  });
}

/** The line's own scenario scene; a line that only goes on with the scene before it (or has another scene) is refused. */
export function scenarioOf(script: Readonly<{ lines: readonly ScriptLine[] }>, lineId: string): ScenarioLine {
  const scene = scenarioLines(script.lines).find(({ line }) => line.id === lineIn(script.lines, lineId).id);
  if (!scene) throw new StudioError('invalid-request', translate('scenarios.notAScenario', { line: lineId }));
  return scene;
}

const STATES: ReadonlyArray<readonly [keyof StageItems['scenarios'], GeneratedState]> = [['blocked', 'blocked'], ['stale', 'stale'], ['missing', 'missing']];

function stateOf(lineId: string, items: StageItems['scenarios']): GeneratedState {
  const found = STATES.find(([list]) => items[list].includes(lineId));
  return found ? found[1] : 'done';
}

/** The background's `generate` (prompt and a known style), when it has one. */
export function generateOf(background: Json): SceneCard['generate'] {
  if (!isObject(background.generate)) return undefined;
  const style = (IMAGE_STYLES as readonly unknown[]).includes(background.generate.style) ? { style: background.generate.style as ImageStyle } : {};
  return { prompt: textOf(background.generate.prompt), ...style };
}

// The crop as the script keeps it (core checks its ranges); anything else is no crop.
function cropOf(value: unknown): ImageCrop | undefined {
  if (!isObject(value)) return undefined;
  const [zoom, x, y] = [value.zoom, value.x, value.y];
  return typeof zoom === 'number' && typeof x === 'number' && typeof y === 'number' ? { zoom, x, y } : undefined;
}

async function backgroundOf(scene: ScenarioLine, view: FileView): Promise<SceneBackground> {
  const image = textOf(scene.background.image);
  if (!image) return { kind: 'vector', vector: textOf(scene.background.vector) || 'room', colors: (isObject(scene.background.colors) ? scene.background.colors : {}) as Record<string, string> };
  const own = image !== generatedFile(scene.line.id);
  const crop = cropOf(scene.background.crop);
  const warning = await view.aspectWarning(image, crop !== undefined);
  return { kind: 'image', image, url: await view.url(image), own, ...(warning ? { aspectWarning: warning } : {}), ...(crop ? { crop } : {}) };
}

/** One card: what the scene shows, its prompt, the image Gizzycera made for it and that image's state (stages, item by item). */
export async function cardOf(scene: ScenarioLine, items: StageItems['scenarios'], view: FileView): Promise<SceneCard> {
  const { line, number } = scene;
  const generate = generateOf(scene.background);
  const problem = items.problems.find((text) => text.includes(`fala ${line.id}:`));
  const kept = view.kept(line.id);
  const extra = generate ? { generate, state: stateOf(line.id, items), ...(problem ? { problem } : {}) } : kept ? { keptPrompt: kept } : {};
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

/** The files of a project as its cards show them (the URL by last change; the shape against the video's aspect). */
export function fileViewOf(parts: Readonly<{ files: MediaFiles; core: MediaCore }>, folder: string, shown: Readonly<{ aspect: '9:16' | '16:9'; kept: ReadonlyMap<string, NonNullable<SceneCard['generate']>> }>): FileView {
  const url = async (file: string) => {
    const version = await parts.files.modified(folder, file);
    return version === undefined ? null : mediaUrlOf(join(folder, file), version);
  };
  const aspectWarning = async (file: string, framed: boolean) => {
    const shape = await parts.core.imageShape(join(folder, file), shown.aspect);
    const values = shape && { width: shape.width, height: shape.height, aspect: shown.aspect };
    return values && !shape.matches ? translate(framed ? 'scenarios.framedShape' : 'scenarios.otherShape', values) : undefined;
  };
  return { url, aspectWarning, kept: (lineId) => shown.kept.get(lineId) };
}

/** The background showing `crop` of its picture (null: all of it); a background without a picture is refused. */
export function croppedBackground(background: Json, crop: ImageCrop | null): Json {
  if (!background.image) throw new StudioError('invalid-request', translate('scenarios.cropNeedsPicture'));
  return crop ? { ...background, crop } : without(background, 'crop');
}
