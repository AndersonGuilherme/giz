import { DomainError } from '../DomainError.ts';
import type { SoundEffect, Line } from '../script/Line.ts';
import type { ResolvedScene, SoundEffectJson, BeatJson } from './VideoProps.ts';
import type { LineTimings } from './LineTimings.ts';
import { BeatText } from './BeatText.ts';

type BeatSource = Readonly<{ text: BeatText; byWord: boolean }>;

// The beats live in the pronunciation (if it has brackets) or in the text, as in the motor. The recorded words
// are the text words: in the pronunciation, the beat falls by the fraction of the spoken text.
function beatSource(line: Line): BeatSource {
  const pronunciation = line.pronunciation();
  const inPronunciation = pronunciation !== line.text() && BeatText.hasBeats(pronunciation);
  return { text: BeatText.of(inPronunciation ? pronunciation : line.text()), byWord: !inPronunciation };
}

function rejectCountMismatch(line: Line, text: BeatText): void {
  const beats = line.beats();
  if (beats.length === text.count()) return;
  throw new DomainError(`fala ${line.id()}: ${text.count()} [trechos] no texto, mas ${beats.length} marca(s)`);
}

function beatFrames(source: BeatSource, times: LineTimings): number[] {
  const { text, byWord } = source;
  const words = text.openingWords();
  return text.fractions().map((fraction, order) => {
    const byRecordedWord = byWord ? times.wordStart(words[order] ?? 0) : undefined;
    return byRecordedWord ?? times.frameAtFraction(fraction);
  });
}

const CHARACTER_FIELDS = new Set(['expression', 'pose', 'sfx']);

/** The beats of a line: the k-th `[span]` of the text fires the k-th beat. */
export class Beats {
  readonly #list: readonly BeatJson[];

  private constructor(list: readonly BeatJson[]) {
    this.#list = list;
  }

  static fromLine(line: Line, times: LineTimings): Beats {
    const source = beatSource(line);
    rejectCountMismatch(line, source.text);
    const frames = beatFrames(source, times);
    return new Beats(line.beats().map((beat, order) => ({ frame: frames[order] ?? 0, changes: { ...beat } })));
  }

  static fromJson(list: readonly BeatJson[]): Beats {
    return new Beats(list);
  }

  /** The scene after all the beats: only the scene fields (no expression, pose or sound). */
  appliedTo(scene: ResolvedScene): ResolvedScene {
    const changes = this.#list.map((beat) => Object.entries(beat.changes).filter(([field]) => !CHARACTER_FIELDS.has(field)));
    // A beat accepts any scene field (like the motor beat); validating each field is the schema's job.
    return { ...scene, ...Object.fromEntries(changes.flat()) } as ResolvedScene;
  }

  /** The sounds of the beats, in absolute frames from `start`. */
  soundEffects(start: number): SoundEffectJson[] {
    return this.#list.flatMap(({ frame, changes }) => {
      const sound = changes.sfx as SoundEffect | undefined;
      return sound ? [{ frame: start + frame, sound }] : [];
    });
  }

  /** The last value of `field` set by a beat up to the relative frame `frame`, and where it was set. */
  lastUntil(field: 'expression' | 'pose', frame: number): BeatJson | undefined {
    const given = this.#list.filter((beat) => beat.frame <= frame && beat.changes[field] !== undefined);
    return given.at(-1);
  }

  toJson(): BeatJson[] {
    return this.#list.map((beat) => ({ frame: beat.frame, changes: { ...beat.changes } }));
  }
}
