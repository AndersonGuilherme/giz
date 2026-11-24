import type { Expression, Pose } from '../../domain/cast/PoseAndExpression.ts';
import { Blink } from '../../domain/character/Blink.ts';
import { Body } from '../../domain/character/Body.ts';
import { CharacterState } from '../../domain/character/CharacterState.ts';
import type { Gaze } from '../../domain/script/Line.ts';
import { Fps, Frame } from '../../domain/values/Time.ts';

/** The fixed state of a character in the preview: no audio, so nobody speaks; only breathing and blinking move. */
export type PreviewState = Readonly<{ pose?: Pose; expression?: Expression; look?: Gaze }>;

const BODY = new Body();

export function previewState(characterId: string, given: PreviewState, frame: Frame): CharacterState {
  const pose = given.pose ?? 'neutral';
  // The phase comes from the id so two characters do not breathe together.
  const context = { pose, poseStart: Frame.of(0), speaking: false, opening: 0, phase: characterId.length * 1.7, fps: Fps.DEFAULT };
  return CharacterState.of({
    pose,
    expression: given.expression ?? 'neutral',
    look: given.look ?? 'other',
    speaking: false,
    viseme: 'X',
    opening: 0,
    blink: Blink.for(characterId).closureAt(frame, Fps.DEFAULT),
    body: BODY.offsetAt(frame, context),
  });
}
