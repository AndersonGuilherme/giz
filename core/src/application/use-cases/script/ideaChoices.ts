import { DomainError } from '../../../domain/DomainError.ts';
import type { Idea } from '../../../domain/idea/Idea.ts';
import { VECTOR_BACKGROUNDS } from '../../../domain/scenario/BackgroundSource.ts';
import type { CastPreset, ScenePreset } from '../../ports/ScriptMaterials.ts';

function unknownNames(field: string, asked: readonly string[], known: readonly string[]): string[] {
  return asked.flatMap((name, index) => (known.includes(name) ? [] : [`- ${field}[${index}]: "${name}" não existe (use ${known.join(', ')})`]));
}

/** The presets an idea asks for must exist: checked before any paid call. */
export function checkIdeaChoices(idea: Idea, presets: Readonly<{ cast: readonly CastPreset[]; scenes: readonly ScenePreset[] }>): void {
  const castIds = presets.cast.map(({ id }) => id);
  const sceneNames = [...VECTOR_BACKGROUNDS, ...presets.scenes.map(({ id }) => id)];
  const problems = [...unknownNames('cast', idea.castIds(), castIds), ...unknownNames('scenes', idea.sceneNames(), sceneNames)];
  if (problems.length > 0) throw new DomainError(['ideia inválida:', ...problems].join('\n'));
}
