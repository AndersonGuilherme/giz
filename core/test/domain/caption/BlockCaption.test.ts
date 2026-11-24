import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockCaption } from '../../../src/domain/caption/BlockCaption.ts';
import { Words } from '../../../src/domain/speech/Words.ts';
import { Frame, Seconds } from '../../../src/domain/values/Time.ts';

function words(text: string, seconds: number): Words {
  const script = Words.fromText(text);
  const indexes = script.texts().map((_text, index) => index);
  return script.withTimes(indexes.map((i) => Seconds.of(i * seconds)), indexes.map((i) => Seconds.of((i + 1) * seconds)));
}

const LONG = 'Este é um texto bem comprido para a legenda. Ele precisa ser cortado em blocos, sempre num lugar bom de ler, sem passar do limite.';

test('a short text is a single block that starts at 0, like captionChunks', () => {
  assert.deepEqual(BlockCaption.blocksOf('Olá, Téo.', 90), [{ text: 'Olá, Téo.', start: 0 }]);
});

test('a long text is cut at the end of a sentence first, with the start as a fraction of the text', () => {
  const blocks = BlockCaption.blocksOf(LONG, 90);
  assert.equal(blocks[0].text, 'Este é um texto bem comprido para a legenda.');
  assert.equal(blocks[0].start, 0);
  assert.ok(blocks.every((block) => block.text.length <= 90));
  assert.equal(blocks.map((block) => block.text).join(' '), LONG);
  assert.ok(blocks[1].start > 0 && blocks[1].start < 1);
});

test('without a sentence end it cuts at a comma, then at a space', () => {
  const comma = 'um dois três quatro cinco seis sete, oito nove dez onze doze treze catorze quinze dezesseis dezessete';
  assert.equal(BlockCaption.blocksOf(comma, 60)[0].text, 'um dois três quatro cinco seis sete,');
  const spaces = 'palavra '.repeat(20).trim();
  const blocks = BlockCaption.blocksOf(spaces, 40);
  assert.ok(blocks.every((block) => block.text.length <= 40 && !block.text.startsWith(' ')));
});

test('each block starts and ends at the real times of its words', () => {
  const caption = BlockCaption.of(words(LONG, 0.25), 90);
  const cues = caption.cues();
  assert.equal(cues[0].text, 'Este é um texto bem comprido para a legenda.');
  assert.equal(cues[0].start.value(), 0);
  // The second block opens at the 10th word ("Ele"): 9 × 0.25 s.
  assert.equal(cues[1].start.value(), 2.25);
  assert.equal(cues[0].end.value(), 2.25);
  assert.equal(cues.at(-1)!.end.value(), LONG.split(' ').length * 0.25);
});

test('blockAt shows the block whose first word already started (the first one before that)', () => {
  const caption = BlockCaption.of(words(LONG, 0.25), 90);
  assert.equal(caption.blockAt(Frame.of(0)), 'Este é um texto bem comprido para a legenda.');
  assert.equal(caption.blockAt(Frame.of(67)), 'Este é um texto bem comprido para a legenda.');
  assert.match(caption.blockAt(Frame.of(68)), /^Ele precisa/);
});

test('a line without words has no blocks', () => {
  const caption = BlockCaption.of(Words.fromText(''), 90);
  assert.deepEqual(caption.cues(), []);
  assert.equal(caption.blockAt(Frame.of(0)), '');
});
