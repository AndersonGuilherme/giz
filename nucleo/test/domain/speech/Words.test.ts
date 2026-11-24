import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../../../src/domain/DomainError.ts';
import { Words } from '../../../src/domain/speech/Words.ts';
import { Seconds } from '../../../src/domain/values/Time.ts';

const s = (...values: number[]) => values.map((value) => Seconds.of(value));

test('fromText removes the brackets of the [span] beats', () => {
  assert.deepEqual(Words.fromText('Um [usou um cupom] e [ pagou ].').texts(), ['Um', 'usou', 'um', 'cupom', 'e', 'pagou', '.']);
});

test('fromText splits on spaces and keeps punctuation attached to the word', () => {
  const words = Words.fromText('  Olá,   Téo!  Tudo bem? ');
  assert.deepEqual(words.texts(), ['Olá,', 'Téo!', 'Tudo', 'bem?']);
});

test('withTimes stores the start and end of each word', () => {
  const words = Words.fromText('um dois').withTimes(s(0, 0.4), s(0.3, 0.9));
  assert.deepEqual(words.toJson(), [
    { text: 'um', start: 0, end: 0.3 },
    { text: 'dois', start: 0.4, end: 0.9 },
  ]);
});

test('withTimes rejects a different number of times and an end before the start', () => {
  const words = Words.fromText('um dois');
  assert.throws(() => words.withTimes(s(0), s(0.3)), DomainError);
  assert.throws(() => words.withTimes(s(0, 0.5), s(0.3, 0.4)), DomainError);
});

test('activeAt returns the last word already started (-1 before the first)', () => {
  const words = Words.fromText('um dois três').withTimes(s(0.1, 0.4, 0.8), s(0.3, 0.7, 1));
  assert.equal(words.activeAt(Seconds.of(0)), -1);
  assert.equal(words.activeAt(Seconds.of(0.1)), 0);
  assert.equal(words.activeAt(Seconds.of(0.35)), 0);
  assert.equal(words.activeAt(Seconds.of(0.5)), 1);
  assert.equal(words.activeAt(Seconds.of(5)), 2);
});

test('toJson returns a copy', () => {
  const words = Words.fromText('um');
  words.toJson()[0]!.text = 'mudou';
  assert.deepEqual(words.texts(), ['um']);
});

test('fromJson keeps the times of words already timed', () => {
  const json = [{ text: 'Oi', start: 0, end: 0.3 }, { text: 'Ana', start: 0.5, end: 1 }];
  const words = Words.fromJson(json);
  assert.deepEqual(words.toJson(), json);
  assert.equal(words.activeAt(Seconds.of(0.5)), 1);
});

test('spokenAt is the word being said, and -1 in a pause or after the end', () => {
  const words = Words.fromText('um dois').withTimes(s(0, 0.5), s(0.3, 0.9));
  assert.equal(words.spokenAt(Seconds.of(0.1)), 0);
  assert.equal(words.spokenAt(Seconds.of(0.3)), -1);
  assert.equal(words.spokenAt(Seconds.of(0.6)), 1);
  assert.equal(words.spokenAt(Seconds.of(2)), -1);
});
