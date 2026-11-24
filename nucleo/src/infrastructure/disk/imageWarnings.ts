import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { problemLine } from '../../application/ports/ProjectError.ts';
import type { LineJson, ScriptJson } from '../schema/scriptSchema.ts';

const exists = (path: string) => access(path).then(() => true, () => false);

async function lineWarning(folder: string, line: LineJson, index: number): Promise<string | undefined> {
  const image = line.scene?.type === 'scenario' ? line.scene.background.image : undefined;
  if (!image || (await exists(join(folder, image)))) return undefined;
  return problemLine({
    file: 'script.json',
    path: `lines[${index}].scene.background.image`,
    message: `${image} não encontrada (fala ${line.id}); o render usa o fundo vetorial padrão`,
  });
}

/** Missing scenario images do not prevent loading: they become warnings. */
export async function imageWarnings(folder: string, script: ScriptJson): Promise<string[]> {
  const warnings = await Promise.all(script.lines.map((line, index) => lineWarning(folder, line, index)));
  return warnings.filter((warning): warning is string => warning !== undefined);
}
