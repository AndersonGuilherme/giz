import type { Expression, Pose } from '../cast/PoseAndExpression.ts';
import type { ParameterValue } from '../cast/Character.ts';
import type { WordJson } from '../speech/WordJson.ts';
import type { CaptionStyle, Format } from '../project/Project.ts';
import type { Scene } from '../script/Scene.ts';
import type { SoundEffect, Gaze, HoldAfter } from '../script/Line.ts';

/** What Remotion receives: JSON only (no class instances nor Float32Array). Frames at 30 fps. */

/** The segment scene with the beat changes of the previous lines already applied. */
export type ResolvedScene = Scene;

export type StateJson = { pose: Pose; expression: Expression; look: Gaze };

/** `frame` is relative to the start of the segment; `changes` holds the scene fields plus the expression, pose and sound. */
export type BeatJson = { frame: number; changes: Record<string, unknown> };

/** `frame` is absolute (from the start of the video). */
export type SoundEffectJson = { frame: number; sound: SoundEffect };

/** A caption word, with start and end in frames relative to the start of the segment. */
export type WordInFrames = WordJson;

export type SegmentJson = {
  lineId: string;
  speaker: string;
  /** Position (from 1) of the line chapter in `VideoProps.chapters`. */
  chapter: number;
  start: number;
  lineDuration: number;
  totalDuration: number;
  scene: ResolvedScene;
  sceneKey: number;
  words: WordInFrames[];
  beats: BeatJson[];
  /** Only characters with a body: the narrator is left out. */
  states: Record<string, StateJson>;
  audio?: string;
  envelope?: number[];
  visemes?: string;
  holdAfter?: HoldAfter;
};

export type CharacterJson = {
  id: string;
  name: string;
  rig?: string;
  parameters: Record<string, ParameterValue>;
  defaultExpression: Expression;
};

export type VideoProps = {
  fps: number;
  width: number;
  height: number;
  language: string;
  format: Format;
  captionStyle: CaptionStyle;
  brand?: string;
  title: string;
  chapters: string[];
  totalFrames: number;
  segments: SegmentJson[];
  cast: CharacterJson[];
  soundEffects: SoundEffectJson[];
};
