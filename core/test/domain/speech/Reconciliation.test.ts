import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { WordJson } from '../../../src/domain/speech/WordJson.ts';
import { Words } from '../../../src/domain/speech/Words.ts';
import { reconcile } from '../../../src/domain/speech/Reconciliation.ts';
import { Seconds } from '../../../src/domain/values/Time.ts';

const w = (text: string, start: number, end: number): WordJson => ({ text, start, end });
const texts = (words: Words) => words.toJson().map((p) => p.text);

function assertIncreasing(words: Words) {
  const json = words.toJson();
  json.forEach((p, i) => {
    assert.ok(p.end >= p.start, `"${p.text}" termina (${p.end}) antes de começar (${p.start})`);
    const previous = json[i - 1];
    if (previous) assert.ok(p.start >= previous.end, `"${p.text}" (${p.start}) começa antes do fim de "${previous.text}" (${previous.end})`);
  });
}

const timeOf = (words: Words, text: string) => words.toJson().find((p) => p.text === text)!;

test('reconciles when Whisper joins two words', () => {
  const r = reconcile(Words.fromText('fiz o pull request ontem'),
    [w('fiz', 0, .2), w('o', .2, .3), w('pullrequest', .3, .9), w('ontem', .9, 1.3)])!;
  assert.deepEqual(r.toJson().map((p) => p.text), ['fiz', 'o', 'pull', 'request', 'ontem']);
  assertIncreasing(r);
  assert.equal(timeOf(r, 'pull').start, 0.3);
  assert.equal(timeOf(r, 'request').end, 0.9);
});

test('keeps the script text, not what was heard', () => {
  const r = reconcile(Words.fromText('Olá, Téo!'), [w('ola', 0, .3), w('teu', .3, .6)])!;
  assert.deepEqual(r.toJson().map((p) => p.text), ['Olá,', 'Téo!']);
  assert.deepEqual(r.toJson()[1], { text: 'Téo!', start: 0.3, end: 0.6 });
});

test('an alignment that is too poor returns null', () => assert.equal(reconcile(Words.fromText('um dois três quatro cinco'), [w('banana', 0, 1)]), null));

test('reconciles when Whisper splits one word in two', () => {
  const r = reconcile(Words.fromText('o microsserviço caiu'),
    [w(' o', 0, .1), w(' micro', .1, .5), w(' serviço', .5, 1), w(' caiu.', 1, 1.4)])!;
  assert.deepEqual(texts(r), ['o', 'microsserviço', 'caiu']);
  assert.deepEqual(timeOf(r, 'microsserviço'), { text: 'microsserviço', start: 0.1, end: 1 });
  assertIncreasing(r);
});

test('English inside a pt-BR line: "deploy" heard as "deplói" keeps the order', () => {
  const r = reconcile(Words.fromText('fiz o deploy ontem'),
    [w(' Fiz', 0, .2), w(' o', .2, .3), w(' deplói', .3, .8), w(' ontem.', .8, 1.2)])!;
  assert.deepEqual(texts(r), ['fiz', 'o', 'deploy', 'ontem']);
  assert.deepEqual(timeOf(r, 'deploy'), { text: 'deploy', start: 0.3, end: 0.8 });
  assertIncreasing(r);
});

test('English inside a pt-BR line: "deploy" heard as "the ploy" keeps the order', () => {
  const r = reconcile(Words.fromText('fiz o deploy ontem'),
    [w(' Fiz', 0, .2), w(' o', .2, .3), w(' the', .3, .45), w(' ploy', .45, .8), w(' ontem.', .8, 1.2)])!;
  assert.deepEqual(texts(r), ['fiz', 'o', 'deploy', 'ontem']);
  assert.deepEqual(timeOf(r, 'deploy'), { text: 'deploy', start: 0.3, end: 0.8 });
  assertIncreasing(r);
});

test('an unpaired script word gets the time between its neighbours', () => {
  const r = reconcile(Words.fromText('hoje vamos aprender juntos'),
    [w(' vamos', .4, .6), w(' aprender', .6, 1), w(' juntos.', 1, 1.4)])!;
  assert.deepEqual(timeOf(r, 'hoje'), { text: 'hoje', start: 0, end: 0.4 });
  assertIncreasing(r);
});

test('unpaired words in the middle and at the end stay in order', () => {
  const r = reconcile(Words.fromText('um dois três quatro cinco'),
    [w('um', 0, .2), w('xyz', .2, .4), w('três', .5, .7), w('quatro', .7, 1)])!;
  assert.ok(timeOf(r, 'dois').start >= 0.2 && timeOf(r, 'dois').end <= 0.5);
  assert.equal(timeOf(r, 'cinco').start, 1);
  assertIncreasing(r);
});

test('out-of-order Whisper times come out in increasing order', () => {
  const r = reconcile(Words.fromText('um dois três'), [w('um', 0, .5), w('dois', .4, .3), w('três', .6, 1)])!;
  assertIncreasing(r);
});

test('heard loose punctuation is ignored', () => {
  const r = reconcile(Words.fromText('Oi, Ana'), [w(' Oi', 0, .2), w(',', .2, .2), w(' Ana.', .3, .7)])!;
  assert.deepEqual(r.toJson(), [{ text: 'Oi,', start: 0, end: 0.2 }, { text: 'Ana', start: 0.3, end: 0.7 }]);
});

test('a script with no heard words returns null', () => assert.equal(reconcile(Words.fromText('um dois'), []), null));

test('a word Whisper did not hear does not steal its neighbour\'s time', () => {
  const r = reconcile(Words.fromText('eu sou a Ana'), [w(' sou', .3, .6), w(' a', .6, .7), w(' Ana.', .7, 1.1)])!;
  assert.deepEqual(r.toJson(), [
    { text: 'eu', start: 0, end: 0.3 }, { text: 'sou', start: 0.3, end: 0.6 },
    { text: 'a', start: 0.6, end: 0.7 }, { text: 'Ana', start: 0.7, end: 1.1 },
  ]);
});

test('a heard time past the end of the audio is limited to the duration', () => {
  const r = reconcile(Words.fromText('um dois'), [w('um', 0, 5), w('dois', 6, 7)], Seconds.of(1))!;
  r.toJson().forEach((p) => assert.ok(p.start <= 1 && p.end <= 1, JSON.stringify(p)));
  assertIncreasing(r);
});

test('unpaired words after the last heard one go to the end of the audio, without a zero duration', () => {
  const r = reconcile(Words.fromText('um dois três quatro cinco'),
    [w('um', 0, .2), w('dois', .2, .4), w('três', .4, .6)], Seconds.of(2))!;
  for (const text of ['quatro', 'cinco']) {
    const p = timeOf(r, text);
    assert.ok(p.end > p.start, `"${text}" com duração zero: ${JSON.stringify(p)}`);
    assert.ok(p.end <= 2);
  }
  assert.equal(timeOf(r, 'quatro').start, 0.6);
  assert.equal(timeOf(r, 'cinco').end, 2);
  assertIncreasing(r);
});
