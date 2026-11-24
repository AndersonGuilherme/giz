import { Font } from '../layout/Font.ts';
import type { Words } from '../speech/Words.ts';
import { Fps, type Frame } from '../values/Time.ts';
import { wordGroups, type WordGroup } from './WordGroups.ts';

/** Heavy capitals with an outline, on a single line: a group never wraps. */
export const WORD_CAPTION_FONT = Font.of({ family: 'display', size: 80, lineHeight: 1.1, maximumLines: 1 });
/** The spoken word grows a little; the group is fitted narrower by this much so the grown word still stays in the box. */
export const ACTIVE_WORD_SCALE = 1.1;
const MAXIMUM_WORDS = 3;
// About the real advance of a heavy capital (TextFit measures 0.70 to keep a margin).
const CAPITAL_WIDTH_IN_EM = 0.65;

/** Room (in em) the spoken word needs on each side once it grows, so it does not run into its neighbours. */
export function activeWordMargin(text: string): number {
  return ((ACTIVE_WORD_SCALE - 1) / 2) * text.length * CAPITAL_WIDTH_IN_EM;
}

export type GroupInFrame = Readonly<{ words: string[]; active: number }>;

const NOTHING: GroupInFrame = { words: [], active: -1 };

/**
 * Word-by-word caption, in the style of the reference videos: groups of up to 3 words that change when the next group
 * starts, with the spoken word highlighted. The whole group fits one line of the given width.
 */
export class WordCaption {
  readonly #words: Words;
  readonly #groups: readonly WordGroup[];

  private constructor(words: Words, groups: readonly WordGroup[]) {
    this.#words = words;
    this.#groups = groups;
  }

  static of(words: Words, width: number): WordCaption {
    const rule = { font: WORD_CAPTION_FONT, width: width / ACTIVE_WORD_SCALE, maximumWords: MAXIMUM_WORDS };
    return new WordCaption(words, wordGroups(words.texts(), rule));
  }

  /** The group on screen at `frame` (relative to the line) and which of its words is being said; none before the first word. */
  groupAt(frame: Frame): GroupInFrame {
    const active = this.#activeWord(frame);
    const group = this.#groupOf(active);
    if (!group) return NOTHING;
    return { words: [...group.texts], active: active - group.first };
  }

  /** The letter size of the group on screen: the base size, or smaller for a long word alone. */
  sizeAt(frame: Frame): number {
    const group = this.#groupOf(this.#activeWord(frame));
    return group?.fit.size ?? WORD_CAPTION_FONT.baseSize();
  }

  /** False when some group does not fit one line even at 60% (the `check` reports it). */
  fits(): boolean {
    return this.#groups.every((group) => group.fit.fits);
  }

  #activeWord(frame: Frame): number {
    return this.#words.activeAt(frame.toSeconds(Fps.DEFAULT));
  }

  #groupOf(word: number): WordGroup | undefined {
    if (word < 0) return undefined;
    return this.#groups.filter((group) => group.first <= word).at(-1);
  }
}
