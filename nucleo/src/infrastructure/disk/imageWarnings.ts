import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { problemLine } from '../../application/ports/ProjectError.ts';
import type { AspectRatio } from '../../domain/values/AspectRatio.ts';
import type { LineJson, ScriptJson } from '../schema/scriptSchema.ts';
import { imageSize } from './imageSize.ts';

/** `field` is where the image is declared: the line scene or one of its beats. */
type Image = Readonly<{ path: string; line: LineJson; field: string }>;
type BeatBackground = Readonly<{ background?: Readonly<{ image?: string }> }>;

const kindOf = (path: string) => stat(path).then((found) => (found.isFile() ? 'file' : 'other'), () => 'missing');

const warning = (image: Image, message: string): string =>
  problemLine({ file: 'script.json', path: image.field, message });

// A missing image falls back to the vector background; one of another aspect is cropped to cover the frame.
async function problemOf(folder: string, image: Image, aspect: AspectRatio): Promise<string | undefined> {
  const file = join(folder, image.path);
  const [id, kind] = [image.line.id, await kindOf(file)];
  if (kind === 'missing') return `${image.path} não encontrada (fala ${id}); o render usa o fundo vetorial padrão`;
  if (kind === 'other') return `${image.path} não é um arquivo (fala ${id})`;
  const size = await imageSize(file);
  if (!size || aspect.matches(size.width, size.height)) return undefined;
  return `${image.path} tem ${size.width}×${size.height}, outra proporção que o vídeo (${aspect.text()}): o render corta as bordas (fala ${id})`;
}

async function lineWarning(folder: string, image: Image, aspect: AspectRatio): Promise<string | undefined> {
  const problem = await problemOf(folder, image, aspect);
  return problem && warning(image, problem);
}

// The scene image and the images the beats switch to, each with the field that declares it.
function imagesOfLine(line: LineJson, index: number): Image[] {
  const scene = line.scene?.type === 'scenario' ? line.scene.background.image : undefined;
  const sceneImage = { path: scene, field: `lines[${index}].scene.background.image` };
  const beats = (line.beats ?? []).map((beat, order) => ({
    path: (beat as BeatBackground).background?.image, field: `lines[${index}].beats[${order}].background.image`,
  }));
  return [sceneImage, ...beats].flatMap(({ path, field }) => (path ? [{ path, field, line }] : []));
}

/** Missing scenario images, or images of another aspect than the video, do not prevent loading: they become warnings. */
export async function imageWarnings(folder: string, script: ScriptJson, aspect: AspectRatio): Promise<string[]> {
  const images = script.lines.flatMap(imagesOfLine);
  const warnings = await Promise.all(images.map((image) => lineWarning(folder, image, aspect)));
  return warnings.filter((text): text is string => text !== undefined);
}
