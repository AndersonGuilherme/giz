import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { problemLine } from '../../application/ports/ProjectError.ts';
import type { AspectRatio } from '../../domain/values/AspectRatio.ts';
import type { LineJson, ScriptJson } from '../schema/scriptSchema.ts';
import { imageSize } from './imageSize.ts';

/**
 * `field` is where the image is declared: the line scene or one of its beats; `generated`: made by `giz images`;
 * `framed`: the person chose the part shown (`background.crop`), so another aspect is no surprise.
 */
type Image = Readonly<{ path: string; line: LineJson; field: string; generated?: boolean; framed?: boolean }>;
type BeatBackground = Readonly<{ background?: Readonly<{ image?: string }> }>;

const kindOf = (path: string) => stat(path).then((found) => (found.isFile() ? 'file' : 'other'), () => 'missing');

const warning = (image: Image, message: string): string =>
  problemLine({ file: 'script.json', path: image.field, message });

const GENERATE_HINT = 'rode giz images <pasta> para gerar com a IA de imagem';

// A missing image falls back to the vector background; one of another aspect is cropped to cover the frame.
async function problemOf(folder: string, image: Image, aspect: AspectRatio): Promise<string | undefined> {
  const file = join(folder, image.path);
  const [id, kind] = [image.line.id, await kindOf(file)];
  const hint = image.generated ? ` (${GENERATE_HINT})` : '';
  if (kind === 'missing') return `${image.path} não encontrada (fala ${id}); o render usa o fundo vetorial padrão${hint}`;
  if (kind === 'other') return `${image.path} não é um arquivo (fala ${id})`;
  return image.framed ? undefined : aspectProblem(file, image, aspect);
}

async function aspectProblem(file: string, image: Image, aspect: AspectRatio): Promise<string | undefined> {
  const size = await imageSize(file);
  if (!size || aspect.matches(size.width, size.height)) return undefined;
  const id = image.line.id;
  return `${image.path} tem ${size.width}×${size.height}, outra proporção que o vídeo (${aspect.text()}): o render corta as bordas (fala ${id})`;
}

async function lineWarning(folder: string, image: Image, aspect: AspectRatio): Promise<string | undefined> {
  const problem = await problemOf(folder, image, aspect);
  return problem && warning(image, problem);
}

const markOf = (background: Readonly<{ generate?: unknown; crop?: unknown }> | undefined) => ({ generated: background?.generate !== undefined, framed: background?.crop !== undefined });

// The scene image and the images the beats switch to, each with the field that declares it.
function imagesOfLine(line: LineJson, index: number): Image[] {
  const background = line.scene?.type === 'scenario' ? line.scene.background : undefined;
  const sceneImage = { path: background?.image, field: `lines[${index}].scene.background.image`, ...markOf(background) };
  const beats = (line.beats ?? []).map((beat, order) => ({
    path: (beat as BeatBackground).background?.image, field: `lines[${index}].beats[${order}].background.image`,
  }));
  return [sceneImage, ...beats].flatMap((image) => (image.path ? [{ ...image, path: image.path, line }] : []));
}

// A scene to generate that has no image yet: the render uses the vector background until `giz images` makes it.
function notGenerated(line: LineJson, index: number): string[] {
  const background = line.scene?.type === 'scenario' ? line.scene.background : undefined;
  if (!background?.generate || background.image) return [];
  const message = `cenário ainda não gerado (fala ${line.id}); o render usa o fundo vetorial: ${GENERATE_HINT}`;
  return [problemLine({ file: 'script.json', path: `lines[${index}].scene.background.generate`, message })];
}

/** Missing scenario images, or images of another aspect than the video, do not prevent loading: they become warnings. */
export async function imageWarnings(folder: string, script: ScriptJson, aspect: AspectRatio): Promise<string[]> {
  const images = script.lines.flatMap(imagesOfLine);
  const warnings = await Promise.all(images.map((image) => lineWarning(folder, image, aspect)));
  return [...script.lines.flatMap(notGenerated), ...warnings.filter((text): text is string => text !== undefined)];
}
