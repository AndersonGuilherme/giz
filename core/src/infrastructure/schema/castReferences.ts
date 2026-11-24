import type { Cast } from '../../domain/cast/Cast.ts';
import type { Script } from '../../domain/script/Script.ts';
import { CharacterId } from '../../domain/values/CharacterId.ts';
import type { ScriptJson } from './scriptSchema.ts';
import type { ProblemCollector } from './errorMessages.ts';

const FILE = 'script.json';

function notInCast(name: string, cast: Cast): string {
  return `"${name}" não está no elenco (${cast.ids().join(', ')})`;
}

function onStageProblem(name: string, cast: Cast): string | undefined {
  const id = CharacterId.of(name);
  if (!cast.contains(id)) return notInCast(name, cast);
  return cast.character(id).hasBody() ? undefined : `${name} não tem corpo e não pode aparecer em cena`;
}

/** Every line must belong to someone in the cast. */
export function checkSpeakers(script: Script, cast: Cast, collector: ProblemCollector): void {
  const unknownIds = script.lines().unknownIds(cast);
  script.lines().each().forEach((line, index) => {
    const speaker = line.speaker().text();
    if (!unknownIds.includes(speaker)) return;
    collector.add({ file: FILE, path: `lines[${index}].speaker`, message: notInCast(speaker, cast) });
  });
}

/** Every character placed in a scenario must be in the cast and have a body. */
export function checkCharactersOnStage(json: ScriptJson, cast: Cast, collector: ProblemCollector): void {
  json.lines.forEach((line, lineIndex) => {
    if (line.scene?.type !== 'scenario') return;
    line.scene.characters.forEach(({ character }, index) => {
      const message = onStageProblem(character, cast);
      const path = `lines[${lineIndex}].scene.characters[${index}].character`;
      if (message) collector.add({ file: FILE, path, message });
    });
  });
}
