import { DomainError } from '../DomainError.ts';
import { Seconds } from '../values/Time.ts';
import type { WordJson } from './WordJson.ts';
import { BeatText } from '../timeline/BeatText.ts';

export type { WordJson };

type Span = Readonly<{ start: Seconds; end: Seconds }>;

const NO_TIME: Span = { start: Seconds.of(0), end: Seconds.of(0) };

/** A script word (with its punctuation attached) and the span of the line in which it is said. */
export class Word {
  readonly #text: string;
  readonly #span: Span;

  private constructor(text: string, span: Span) {
    this.#text = text;
    this.#span = span;
  }

  static of(text: string, span: Span = NO_TIME): Word {
    if (span.end.value() < span.start.value()) {
      throw new DomainError(`palavra "${text}" termina (${span.end.value()} s) antes de começar (${span.start.value()} s)`);
    }
    return new Word(text, span);
  }

  text(): string {
    return this.#text;
  }

  startedBy(instant: Seconds): boolean {
    return this.#span.start.value() <= instant.value();
  }

  /** Being said at `instant`: started and not yet ended. */
  saidAt(instant: Seconds): boolean {
    return this.startedBy(instant) && instant.value() < this.#span.end.value();
  }

  toJson(): WordJson {
    return { text: this.#text, start: this.#span.start.value(), end: this.#span.end.value() };
  }
}

/** The words of a line, in script order. The caption always shows these texts, never what was heard. */
export class Words {
  readonly #words: readonly Word[];

  private constructor(words: readonly Word[]) {
    this.#words = words;
  }

  /** The brackets of the `[span]` beats are not part of the words. */
  static fromText(text: string): Words {
    const texts = BeatText.of(text).clean().split(/\s+/).filter(Boolean);
    return new Words(texts.map((word) => Word.of(word)));
  }

  /** Words already timed (in seconds), such as a recorded voice or a segment converted from frames. */
  static fromJson(json: readonly WordJson[]): Words {
    return new Words(json.map(({ text, start, end }) => Word.of(text, { start: Seconds.of(start), end: Seconds.of(end) })));
  }

  withTimes(starts: readonly Seconds[], ends: readonly Seconds[]): Words {
    const total = this.#words.length;
    if (starts.length !== total || ends.length !== total) {
      throw new DomainError(`${total} palavra(s), mas ${starts.length} início(s) e ${ends.length} fim(ns)`);
    }
    const timed = this.#words.map(
      (word, index) => Word.of(word.text(), { start: starts[index] ?? NO_TIME.start, end: ends[index] ?? NO_TIME.end }),
    );
    return new Words(timed);
  }

  /** Index of the last word already started at `instant`; -1 before the first. */
  activeAt(instant: Seconds): number {
    return this.#words.reduce((active, word, index) => (word.startedBy(instant) ? index : active), -1);
  }

  /** Index of the word being said at `instant`; -1 in a pause, before the first word and after the last. */
  spokenAt(instant: Seconds): number {
    return this.#words.findIndex((word) => word.saidAt(instant));
  }

  texts(): string[] {
    return this.#words.map((word) => word.text());
  }

  toJson(): WordJson[] {
    return this.#words.map((word) => word.toJson());
  }
}
