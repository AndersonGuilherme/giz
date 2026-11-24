import type { Expression, Pose } from '../cast/PoseAndExpression.ts';
import type { Viseme } from '../speech/Visemes.ts';
import type { Gaze } from '../script/Line.ts';
import type { BodyOffset } from './Body.ts';

export type StateData = Readonly<{
  pose: Pose;
  expression: Expression;
  look: Gaze;
  speaking: boolean;
  viseme: Viseme;
  opening: number; // speech volume, from 0 to 1
  blink: number; // eye closure, from 0 to 1
  body: BodyOffset;
  /** Video time of the state, in seconds from the start (absent in sheets and stills: 0). */
  seconds?: number;
}>;

/** Everything that defines how a character looks in a frame; Task 9 builds it with `CharacterState.of(...)`. */
export class CharacterState {
  readonly #data: StateData;

  private constructor(data: StateData) {
    this.#data = data;
  }

  static of(data: StateData): CharacterState {
    return new CharacterState(data);
  }

  pose(): Pose {
    return this.#data.pose;
  }

  expression(): Expression {
    return this.#data.expression;
  }

  gaze(): Gaze {
    return this.#data.look;
  }

  isSpeaking(): boolean {
    return this.#data.speaking;
  }

  viseme(): Viseme {
    return this.#data.viseme;
  }

  opening(): number {
    return this.#data.opening;
  }

  eyeClosure(): number {
    return this.#data.blink;
  }

  bodyOffset(): BodyOffset {
    return this.#data.body;
  }

  /** The time on the whole video: motion that must not restart with each segment (a ghost's bob) follows this. */
  videoSeconds(): number {
    return this.#data.seconds ?? 0;
  }
}
