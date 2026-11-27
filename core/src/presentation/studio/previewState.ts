import type { Expression, Pose } from '../../domain/cast/PoseAndExpression.ts';
import { Blink } from '../../domain/character/Blink.ts';
import { Body } from '../../domain/character/Body.ts';
import { CharacterState } from '../../domain/character/CharacterState.ts';
import type { Viseme } from '../../domain/speech/Visemes.ts';
import { Fps, Frame } from '../../domain/values/Time.ts';
import type { ValidatedParameters } from '../rigs/RigModel.ts';

/** A said sentence: its mouth per frame (from the sample's audio, or made up from the text) and, when there is one, its audio. */
export type PreviewSpeech = Readonly<{ visemes: string; envelope: readonly number[]; audio?: string }>;

/**
 * One character alone, for the Studio's cast editor (a Remotion `<Player>` plays it): it breathes and blinks, makes its
 * pose's gesture once at the start and says `speech`. `height`: the character's height inside the composition.
 */
export type CharacterPreviewProps = Readonly<{
  id: string;
  rig: string;
  parameters: ValidatedParameters;
  pose: Pose;
  expression: Expression;
  height: number;
  speech?: PreviewSpeech;
}>;

const BODY = new Body();
const FPS = Fps.DEFAULT;

function mouthAt(speech: PreviewSpeech | undefined, frame: number) {
  const opening = speech?.envelope[frame] ?? 0;
  const viseme = (speech?.visemes[frame] ?? 'X') as Viseme;
  return { speaking: speech !== undefined && frame < speech.envelope.length, viseme, opening };
}

/** The character's state in a frame of the preview (exported for tests). */
export function previewStateAt(props: Pick<CharacterPreviewProps, 'id' | 'pose' | 'expression' | 'speech'>, frame: number): CharacterState {
  const mouth = mouthAt(props.speech, frame);
  const at = Frame.of(frame);
  const context = { pose: props.pose, poseStart: Frame.of(0), speaking: mouth.speaking, opening: mouth.opening, phase: props.id.length * 1.7, fps: FPS };
  return CharacterState.of({
    ...mouth, pose: props.pose, expression: props.expression, look: 'camera',
    blink: Blink.for(props.id).closureAt(at, FPS), body: BODY.offsetAt(at, context), seconds: frame / FPS.value(),
  });
}

// Letters to mouth shapes, roughly (no phonemizer in the window): enough to see the mouth move before a sample exists.
const LETTER_VISEMES: ReadonlyMap<string, Viseme> = new Map(
  (['aA', 'eE', 'iI', 'yI', 'oO', 'uU', 'mM', 'bM', 'pM', 'fF', 'vF'] as const).map((pair) => [pair[0], pair[1] as Viseme]),
);
const FRAMES_PER_LETTER = 2;
const restingMark = /[\s,.;:!?…]/;

function letterViseme(letter: string): Viseme {
  if (restingMark.test(letter)) return 'X';
  return LETTER_VISEMES.get(letter) ?? 'C';
}

/** A made-up mouth for a sentence (two frames per letter, open on vowels, closed at spaces and punctuation), no audio. */
export function speechFromText(text: string): PreviewSpeech {
  const letters = [...text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()];
  const visemes = letters.flatMap((letter) => Array<Viseme>(FRAMES_PER_LETTER).fill(letterViseme(letter)));
  const envelope = visemes.map((viseme) => (viseme === 'X' ? 0 : 0.35 + 0.5 * Number('AEIOU'.includes(viseme))));
  return { visemes: visemes.join(''), envelope };
}
