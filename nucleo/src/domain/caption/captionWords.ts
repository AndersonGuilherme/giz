import { Words } from '../speech/Words.ts';
import type { WordInFrames } from '../timeline/VideoProps.ts';
import { Fps } from '../values/Time.ts';

const toSeconds = (frames: number): number => frames / Fps.DEFAULT.value();

const usable = (word: WordInFrames): boolean =>
  Number.isFinite(word.start) && Number.isFinite(word.end) && word.start >= 0 && word.end >= word.start;

// Usable times: every word has a valid span, they never go back and, with more than one word, they do not all start together.
function hasUsableTimes(words: readonly WordInFrames[]): boolean {
  const ordered = words.every((word, index) => index === 0 || word.start >= words[index - 1].start);
  const spread = words.length < 2 || words.some((word) => word.start !== words[0].start);
  return words.every(usable) && ordered && spread;
}

// Where each word starts, in frames, spread over the line by letters (as the timeline does without recorded words).
function proportionalStarts(texts: readonly string[], lineDuration: number): number[] {
  const size = Math.max(1, texts.join(' ').length);
  const offsets = texts.map((_text, index) => texts.slice(0, index).reduce((sum, previous) => sum + previous.length + 1, 0));
  return offsets.map((offset) => (offset * lineDuration) / size);
}

function proportional(words: readonly WordInFrames[], lineDuration: number): WordInFrames[] {
  const texts = words.map((word) => word.text);
  const starts = proportionalStarts(texts, lineDuration);
  return texts.map((text, index) => ({ text, start: starts[index], end: starts[index + 1] ?? lineDuration }));
}

/**
 * The caption words of a segment, in seconds from the start of the line. Times that cannot be used (old props, voices
 * recorded before the word alignment) are spread over the line by letters, so the caption never breaks.
 */
export function captionWords(words: readonly WordInFrames[] | undefined, lineDuration: number): Words {
  const list = words ?? [];
  const timed = hasUsableTimes(list) ? list : proportional(list, Math.max(0, lineDuration));
  return Words.fromJson(timed.map(({ text, start, end }) => ({ text, start: toSeconds(start), end: toSeconds(end) })));
}
