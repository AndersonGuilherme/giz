import type { Cast } from '../cast/Cast.ts';
import type { Character } from '../cast/Character.ts';
import type { Scene } from '../script/Scene.ts';
import type { Line, Gaze } from '../script/Line.ts';
import type { StateJson } from './VideoProps.ts';

// In a stage scene (scenario or talk) the speaker looks at the other; in lesson scenes, at the content.
function defaultSpeakerGaze(scene: Scene): Gaze {
  return scene.type === 'scenario' || scene.type === 'talk' ? 'other' : 'content';
}

function speakerState(line: Line, character: Character, scene: Scene): StateJson {
  return {
    pose: line.pose() ?? 'neutral',
    expression: line.expression() ?? character.defaultExpression(),
    look: line.look() ?? defaultSpeakerGaze(scene),
  };
}

// Listeners react only with the body: the line reaction or the default.
function listenerState(line: Line, character: Character): StateJson {
  const reaction = line.reaction() ?? {};
  return { pose: reaction.pose ?? 'neutral', expression: reaction.expression ?? character.defaultExpression(), look: reaction.look ?? 'other' };
}

function stateOf(line: Line, character: Character, scene: Scene): StateJson {
  if (character.hasId(line.speaker())) return speakerState(line, character, scene);
  return listenerState(line, character);
}

function idText(character: Character): string {
  const id = character.id();
  return id.text();
}

/** Pose, expression and look of each character with a body during the line; the narrator (no body) is left out. */
export function lineStates(line: Line, cast: Cast, scene: Scene): Record<string, StateJson> {
  const withBody = cast.each().filter((character) => character.hasBody());
  return Object.fromEntries(withBody.map((character) => [idText(character), stateOf(line, character, scene)]));
}
