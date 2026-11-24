import type { Cast } from '../cast/Cast.ts';
import { Words } from '../speech/Words.ts';
import type { Line, HoldAfter } from '../script/Line.ts';
import { Fps, Seconds } from '../values/Time.ts';
import { segmentSoundEffects } from './SoundEffects.ts';
import { lineStates } from './LineStates.ts';
import { Beats } from './Beats.ts';
import { lineHold } from './ReadingHold.ts';
import type { ResolvedScene, SoundEffectJson, SegmentJson } from './VideoProps.ts';
import type { LineScene } from './SceneSequence.ts';
import { LineTimings, type LineVoice } from './LineTimings.ts';

export type SegmentContext = Readonly<{ start: number; scene: LineScene; cast: Cast }>;

const BREATHER_IN_SECONDS = 0.35;

const toFrames = (seconds: number): number => Seconds.of(seconds).toFrames(Fps.DEFAULT).value();

function totalDuration(lineDuration: number, hold: HoldAfter | undefined): number {
  return lineDuration + Math.round((hold?.seconds ?? 0) * Fps.DEFAULT.value()) + toFrames(BREATHER_IN_SECONDS);
}

// What the line has that depends only on itself and on the recorded voice.
function fromLine(line: Line, voice: LineVoice, scene: LineScene) {
  const speaker = line.speaker();
  const scriptWords = Words.fromText(line.text());
  const texts = scriptWords.texts();
  const times = LineTimings.of(voice, texts);
  const hold = lineHold(line, scene.opened ? scene.scene : undefined);
  return { speaker: speaker.text(), times, words: times.toFrames(texts), hold };
}

/** A line placed on the timeline: where it starts, how long it lasts, the scene, the beats and the state of each character. */
export class LineSegment {
  readonly #json: SegmentJson;
  readonly #effects: readonly SoundEffectJson[];

  private constructor(json: SegmentJson, effects: readonly SoundEffectJson[]) {
    this.#json = json;
    this.#effects = effects;
  }

  static build(line: Line, voice: LineVoice, context: SegmentContext): LineSegment {
    const { speaker, times, words, hold } = fromLine(line, voice, context.scene);
    const beats = Beats.fromLine(line, times);
    const { scene, key } = context.scene;
    const json: SegmentJson = {
      lineId: line.id(), speaker, start: context.start, lineDuration: times.frames(), totalDuration: totalDuration(times.frames(), hold),
      scene, sceneKey: key, words, beats: beats.toJson(), states: lineStates(line, context.cast, scene),
      audio: voice.file, envelope: [...voice.envelope], visemes: voice.visemes, ...(hold ? { holdAfter: hold } : {}),
    };
    return new LineSegment(json, segmentSoundEffects(line, json, context.scene));
  }

  /** The (absolute) frame where the next segment starts. */
  end(): number {
    return this.#json.start + this.#json.totalDuration;
  }

  /** The scene with the beat changes of this segment, for the next line that inherits it. */
  sceneAfter(): ResolvedScene {
    const beats = Beats.fromJson(this.#json.beats);
    return beats.appliedTo(this.#json.scene);
  }

  /** The sounds of the segment, in absolute frames. */
  soundEffects(): SoundEffectJson[] {
    return [...this.#effects];
  }

  toJson(): SegmentJson {
    return structuredClone(this.#json);
  }
}
