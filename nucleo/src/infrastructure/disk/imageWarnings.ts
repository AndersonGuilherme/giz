import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { problemLine } from '../../application/ports/ProjectError.ts';
import type { AspectRatio } from '../../domain/values/AspectRatio.ts';
import type { LineJson, ScriptJson } from '../schema/scriptSchema.ts';
import { imageSize } from './imageSize.ts';

type Image = Readonly<{ path: string; line: LineJson; index: number }>;

const exists = (path: string) => access(path).then(() => true, () => false);

const warning = (image: Image, message: string): string =>
  problemLine({ file: 'script.json', path: `lines[${image.index}].scene.background.image`, message });

// A missing image falls back to the vector background; one of another aspect is cropped to cover the frame.
async function problemOf(folder: string, image: Image, aspect: AspectRatio): Promise<string | undefined> {
  const file = join(folder, image.path);
  const id = image.line.id;
  if (!(await exists(file))) return `${image.path} não encontrada (fala ${id}); o render usa o fundo vetorial padrão`;
  const size = await imageSize(file);
  if (!size || aspect.matches(size.width, size.height)) return undefined;
  return `${image.path} tem ${size.width}×${size.height}, outra proporção que o vídeo (${aspect.text()}): o render corta as bordas (fala ${id})`;
}

async function lineWarning(folder: string, image: Image, aspect: AspectRatio): Promise<string | undefined> {
  const problem = await problemOf(folder, image, aspect);
  return problem && warning(image, problem);
}

function imagesOf(script: ScriptJson): Image[] {
  return script.lines.flatMap((line, index) => {
    const path = line.scene?.type === 'scenario' ? line.scene.background.image : undefined;
    return path ? [{ path, line, index }] : [];
  });
}

/** Missing scenario images, or images of another aspect than the video, do not prevent loading: they become warnings. */
export async function imageWarnings(folder: string, script: ScriptJson, aspect: AspectRatio): Promise<string[]> {
  const warnings = await Promise.all(imagesOf(script).map((image) => lineWarning(folder, image, aspect)));
  return warnings.filter((text): text is string => text !== undefined);
}
