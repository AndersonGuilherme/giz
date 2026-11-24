import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captionWords } from '../../../src/domain/caption/captionWords.ts';
import { WordCaption } from '../../../src/domain/caption/WordCaption.ts';
import { LineTimings } from '../../../src/domain/timeline/LineTimings.ts';
import { Frame } from '../../../src/domain/values/Time.ts';

test('the segment words in frames become words in seconds', () => {
  const words = captionWords([{ text: 'Oi', start: 0, end: 9 }, { text: 'Ana', start: 15, end: 30 }], 30);
  assert.deepEqual(words.toJson(), [{ text: 'Oi', start: 0, end: 0.3 }, { text: 'Ana', start: 0.5, end: 1 }]);
});

test('words without usable times are spread over the line by letters', () => {
  const broken = [{ text: 'um', start: 0, end: 0 }, { text: 'dois', start: 0, end: 0 }, { text: 'tres', start: 0, end: 0 }];
  const words = captionWords(broken, 120);
  // "um dois tres" has 12 letters: the words start at 0, 3/12 and 8/12 of 120 frames (4 s).
  assert.deepEqual(words.toJson().map((word) => word.start), [0, 1, 4 * 8 / 12]);
  assert.equal(words.toJson().at(-1)!.end, 4);
});

test('times that are missing, negative or going back also fall back to the proportional spread', () => {
  // "um do" has 5 letters: "do" starts at 3/5 of 60 frames (1.2 s).
  const old = [{ text: 'um', start: Number.NaN, end: 3 }, { text: 'do', start: 9, end: 6 }];
  assert.deepEqual(captionWords(old, 60).toJson().map((word) => word.start), [0, 1.2]);
  const back = [{ text: 'um', start: 10, end: 12 }, { text: 'do', start: 4, end: 8 }];
  assert.equal(captionWords(back, 60).toJson()[1].start, 1.2);
});

test('a segment without words (old props) gives no words and does not crash', () => {
  assert.deepEqual(captionWords(undefined, 60).toJson(), []);
});

test('a voice recorded before Task 6 (no words) still drives the word caption', () => {
  const envelope = Array.from({ length: 60 }, () => 0.5);
  const texts = ['Você', 'ficou', 'sem', 'wi-fi'];
  const frames = LineTimings.of({ file: 'a.wav', envelope, visemes: 'A'.repeat(60) }, texts).toFrames(texts);
  const caption = WordCaption.of(captionWords(frames, 60), 908);
  assert.deepEqual(caption.groupAt(Frame.of(0)), { words: ['Você', 'ficou', 'sem'], active: 0 });
  assert.deepEqual(caption.groupAt(Frame.of(59)), { words: ['wi-fi'], active: 0 });
});
