// Joins what speech recognition heard (with times) to the script words (the text that counts).
import { Seconds } from '../values/Time.ts';
import { alignSequences, type Range, type Pair } from './SequenceAlignment.ts';
import type { WordJson } from './WordJson.ts';
import type { Words } from './Words.ts';
import { normalize } from './Similarity.ts';

type Span = Readonly<{ start: number; end: number }>;

const MINIMUM_PAIRED = 0.6;
const ZERO: Span = { start: 0, end: 0 };

// Weight of each word in time: its number of letters (at least 1).
const weights = (texts: readonly string[]) => texts.map((text) => Math.max(1, normalize(text).length));

// Splits the span among the words, in proportion to the weight; `start*(1-f) + end*f` hits the ends exactly.
function distribute(span: Span, wordWeights: readonly number[]): Span[] {
  const total = wordWeights.reduce((sum, weight) => sum + weight, 0);
  const cumulatives = wordWeights.map((_weight, index) => wordWeights.slice(0, index).reduce((sum, weight) => sum + weight, 0));
  const point = (cumulative: number) => span.start * (1 - cumulative / total) + span.end * (cumulative / total);
  return cumulatives.map((cumulative, index) => ({ start: point(cumulative), end: point(cumulative + (wordWeights[index] ?? 0)) }));
}

function place(times: (Span | undefined)[], range: Range, spans: readonly Span[]): void {
  spans.forEach((span, offset) => (times[range.start + offset] = span));
}

function pairTimes(pairs: readonly Pair[], texts: readonly string[], heard: readonly WordJson[]): (Span | undefined)[] {
  const times: (Span | undefined)[] = texts.map(() => undefined);
  pairs.forEach(({ script, heard: range }) => {
    const span = { start: heard[range.start]?.start ?? 0, end: heard[range.end - 1]?.end ?? 0 };
    place(times, script, distribute(span, weights(texts.slice(script.start, script.end))));
  });
  return times;
}

// Runs of script words that were left without a pair.
function gaps(times: readonly (Span | undefined)[]): Range[] {
  return times.reduce<Range[]>((ranges, time, index) => {
    if (time) return ranges;
    const last = ranges.at(-1);
    if (last?.end === index) return [...ranges.slice(0, -1), { start: last.start, end: index + 1 }];
    return [...ranges, { start: index, end: index + 1 }];
  }, []);
}

// Unpaired words get the time between the previous and the next neighbour (or the end of the audio, if there is no next).
function fillGaps(times: (Span | undefined)[], texts: readonly string[], heardEnd: number): Span[] {
  gaps(times).forEach((range) => {
    const start = times[range.start - 1]?.end ?? 0;
    const end = Math.max(start, times[range.end]?.start ?? heardEnd);
    place(times, range, distribute({ start, end }, weights(texts.slice(range.start, range.end))));
  });
  return times.map((time) => time ?? ZERO);
}

// No word starts before the end of the previous one nor ends before it starts.
function inOrder(times: readonly Span[]): Span[] {
  return times.reduce<Span[]>((sorted, { start, end }) => {
    const beginning = Math.max(start, sorted.at(-1)?.end ?? 0);
    return [...sorted, { start: beginning, end: Math.max(end, beginning) }];
  }, []);
}

const paired = (pairs: readonly Pair[]) => pairs.reduce((sum, { script }) => sum + script.end - script.start, 0);

// What was heard, without loose punctuation and without going past the end of the audio.
function audibleUntil(heard: readonly WordJson[], maximumEnd: Seconds | undefined): WordJson[] {
  const limit = maximumEnd?.value() ?? Infinity;
  const audible = heard.filter((heardWord) => normalize(heardWord.text) !== '');
  return audible.map(({ text, start, end }) => ({ text, start: Math.min(start, limit), end: Math.min(end, limit) }));
}

// How far the unpaired words at the end go: the audio duration or, without it, the end of what was heard.
const lastInstant = (audible: readonly WordJson[], maximumEnd: Seconds | undefined) =>
  maximumEnd?.value() ?? Math.max(0, ...audible.map((heardWord) => heardWord.end));

/**
 * The script words with the times of what was heard, in increasing time order and not past `maximumEnd`
 * (the audio duration); unpaired words after the last heard one go up to it.
 * `null` when fewer than 60% of the script words found a pair: then the alignment is not trustworthy.
 */
export function reconcile(script: Words, heard: readonly WordJson[], maximumEnd?: Seconds): Words | null {
  const texts = script.texts();
  const audible = audibleUntil(heard, maximumEnd);
  const pairs = alignSequences(texts.map(normalize), audible.map((heardWord) => normalize(heardWord.text)));
  if (texts.length === 0 || paired(pairs) < MINIMUM_PAIRED * texts.length) return null;
  const times = inOrder(fillGaps(pairTimes(pairs, texts, audible), texts, lastInstant(audible, maximumEnd)));
  return script.withTimes(times.map(({ start }) => Seconds.of(start)), times.map(({ end }) => Seconds.of(end)));
}
