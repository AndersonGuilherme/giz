import type { Expression, Pose } from '../cast/PoseAndExpression.ts';
import type { CharacterId } from '../values/CharacterId.ts';
import { BeatText } from '../timeline/BeatText.ts';
import type { Chapter } from './Chapter.ts';
import type { Scene } from './Scene.ts';

export const GAZES = ['camera', 'other', 'content'] as const;
export type Gaze = (typeof GAZES)[number];

export const SOUND_EFFECTS = ['pop', 'whoosh', 'ding', 'dings', 'error', 'success', 'tick'] as const;
export type SoundEffect = (typeof SOUND_EFFECTS)[number];

/** How listeners react, during the line. */
export type Reaction = Readonly<{ expression?: Expression; pose?: Pose; look?: Gaze }>;

/** Beat (the old motor beat): applied when the narration reaches the k-th `[span]`; accepts scene fields. */
export type Beat = Readonly<Record<string, unknown>> &
  Readonly<{ expression?: Expression; pose?: Pose; sfx?: SoundEffect }>;

export type HoldAfter = Readonly<{ seconds: number; label: string }>;

/** `pronunciation` is the text for the voice (the old `say`). */
export type LineData = Readonly<{
  id: string;
  chapter: Chapter;
  text: string;
  pronunciation?: string;
  pose?: Pose;
  expression?: Expression;
  look?: Gaze;
  reaction?: Reaction;
  scene?: Scene;
  beats?: readonly Beat[];
  holdAfter?: HoldAfter;
  sfx?: SoundEffect;
}>;

const NO_BEATS: readonly Beat[] = [];

export class Line {
  readonly #speaker: CharacterId;
  readonly #data: LineData;

  private constructor(speaker: CharacterId, data: LineData) {
    this.#speaker = speaker;
    this.#data = data;
  }

  static of(speaker: CharacterId, data: LineData): Line {
    return new Line(speaker, data);
  }

  speaker(): CharacterId {
    return this.#speaker;
  }

  id(): string {
    return this.#data.id;
  }

  chapter(): Chapter {
    return this.#data.chapter;
  }

  text(): string {
    return this.#data.text;
  }

  /** The text for the voice (own pronunciation or the caption text), without the `[span]` brackets of the beats. */
  pronunciation(): string {
    return BeatText.of(this.#data.pronunciation ?? this.#data.text).clean();
  }

  /** The own pronunciation as written, `[span]` beats included; `undefined` when the line has none. */
  markedPronunciation(): string | undefined {
    return this.#data.pronunciation;
  }

  pose(): Pose | undefined {
    return this.#data.pose;
  }

  expression(): Expression | undefined {
    return this.#data.expression;
  }

  look(): Gaze | undefined {
    return this.#data.look;
  }

  reaction(): Reaction | undefined {
    return this.#data.reaction;
  }

  /** Absent: the line inherits the previous scene. */
  scene(): Scene | undefined {
    return this.#data.scene;
  }

  beats(): readonly Beat[] {
    return this.#data.beats ?? NO_BEATS;
  }

  holdAfter(): HoldAfter | undefined {
    return this.#data.holdAfter;
  }

  sfx(): SoundEffect | undefined {
    return this.#data.sfx;
  }
}
