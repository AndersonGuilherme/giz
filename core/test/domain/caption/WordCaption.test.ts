import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeWordMargin, ACTIVE_WORD_SCALE, WordCaption, WORD_CAPTION_FONT } from '../../../src/domain/caption/WordCaption.ts';
import { Words } from '../../../src/domain/speech/Words.ts';
import { Frame, Seconds } from '../../../src/domain/values/Time.ts';

// Every word lasts `seconds`, one after the other.
function words(text: string, seconds: number): Words {
  const script = Words.fromText(text);
  const indexes = script.texts().map((_text, index) => index);
  return script.withTimes(indexes.map((i) => Seconds.of(i * seconds)), indexes.map((i) => Seconds.of((i + 1) * seconds)));
}

test('a group of up to 3 words with the right active word', () => {
  const caption = WordCaption.of(words('Você ficou ali sem televisão e paciência', 0.3), 908);
  assert.deepEqual(caption.groupAt(Frame.of(10)), { words: ['Você', 'ficou', 'ali'], active: 1 });
});

test('the group changes only when the next group starts', () => {
  const caption = WordCaption.of(words('Você ficou ali sem televisão e paciência', 0.3), 908);
  assert.deepEqual(caption.groupAt(Frame.of(26)), { words: ['Você', 'ficou', 'ali'], active: 2 });
  assert.deepEqual(caption.groupAt(Frame.of(27)), { words: ['sem', 'televisão'], active: 0 });
});

test('a group that does not fit one line at the base size gets fewer words', () => {
  const caption = WordCaption.of(words('sem televisão e paciência', 0.3), 908);
  assert.deepEqual(caption.groupAt(Frame.of(0)).words, ['sem', 'televisão']);
  assert.deepEqual(caption.groupAt(Frame.of(18)).words, ['e', 'paciência']);
});

test('punctuation closes the group, as in "CHUVA."', () => {
  const caption = WordCaption.of(words('Veio a chuva. E depois', 0.3), 908);
  assert.deepEqual(caption.groupAt(Frame.of(0)).words, ['Veio', 'a', 'chuva.']);
  assert.deepEqual(caption.groupAt(Frame.of(28)).words, ['E', 'depois']);
  const comma = WordCaption.of(words('Sim, você ficou', 0.3), 908);
  assert.deepEqual(comma.groupAt(Frame.of(0)).words, ['Sim,']);
});

test('before the first word starts there is no caption; after the last, the last group stays without highlight', () => {
  const late = Words.fromText('Oi Ana').withTimes([Seconds.of(1), Seconds.of(1.5)], [Seconds.of(1.4), Seconds.of(2)]);
  const caption = WordCaption.of(late, 908);
  assert.deepEqual(caption.groupAt(Frame.of(0)), { words: [], active: -1 });
  assert.deepEqual(caption.groupAt(Frame.of(50)), { words: ['Oi', 'Ana'], active: 1 });
  assert.deepEqual(caption.groupAt(Frame.of(300)), { words: ['Oi', 'Ana'], active: -1 });
});

test('in a pause between words the group stays but nothing is highlighted', () => {
  // "Oi" from 0 to 0.3 s, pause, "Ana" from 1 s.
  const paused = Words.fromText('Oi Ana').withTimes([Seconds.of(0), Seconds.of(1)], [Seconds.of(0.3), Seconds.of(1.4)]);
  const caption = WordCaption.of(paused, 908);
  assert.deepEqual(caption.groupAt(Frame.of(3)), { words: ['Oi', 'Ana'], active: 0 });
  assert.deepEqual(caption.groupAt(Frame.of(15)), { words: ['Oi', 'Ana'], active: -1 });
  assert.deepEqual(caption.groupAt(Frame.of(31)), { words: ['Oi', 'Ana'], active: 1 });
});

test('a group that fits stays at the base size of the display family', () => {
  const caption = WordCaption.of(words('Você acordou', 0.3), 908);
  assert.equal(WORD_CAPTION_FONT.family(), 'display');
  assert.equal(caption.sizeAt(Frame.of(0)), WORD_CAPTION_FONT.baseSize());
  assert.equal(caption.fits(), true);
});

test('a long word alone shrinks to fit one line', () => {
  const caption = WordCaption.of(words('Desenvolvimentista', 0.3), 908);
  assert.ok(caption.sizeAt(Frame.of(0)) < WORD_CAPTION_FONT.baseSize());
  assert.ok(caption.sizeAt(Frame.of(0)) >= WORD_CAPTION_FONT.baseSize() * 0.6);
  assert.equal(caption.fits(), true);
});

test('a huge single word shrinks and is reported when it still cannot fit', () => {
  const caption = WordCaption.of(words('Oi pneumoultramicroscopicossilicovulcanoconiótico', 0.3), 908);
  assert.deepEqual(caption.groupAt(Frame.of(9)).words, ['pneumoultramicroscopicossilicovulcanoconiótico']);
  assert.equal(caption.sizeAt(Frame.of(9)), WORD_CAPTION_FONT.baseSize() * 0.6);
  assert.equal(caption.fits(), false);
});

test('a line without words has no caption and fits', () => {
  const caption = WordCaption.of(Words.fromText(''), 908);
  assert.deepEqual(caption.groupAt(Frame.of(5)), { words: [], active: -1 });
  assert.equal(caption.fits(), true);
});

test('the spoken word gets room on each side in proportion to its length', () => {
  assert.ok(ACTIVE_WORD_SCALE > 1);
  assert.ok(activeWordMargin('A') < activeWordMargin('CHUVA.'));
  assert.ok(activeWordMargin('CHUVA.') < 0.3);
});

test('a group heavy with wide capitals gets fewer words instead of running out of the line', () => {
  const caption = WordCaption.of(words('mmmm wwww mmmm', 0.3), 908);
  assert.deepEqual(caption.groupAt(Frame.of(0)).words, ['mmmm', 'wwww']);
  assert.deepEqual(caption.groupAt(Frame.of(19)).words, ['mmmm']);
  assert.equal(caption.fits(), true);
});
