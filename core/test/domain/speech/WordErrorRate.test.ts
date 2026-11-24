import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparableWords, wordErrors } from '../../../src/domain/speech/WordErrorRate.ts';

test('words lose case, accents and punctuation; hyphenated words are joined', () => {
  assert.deepEqual(comparableWords('Então, o E-mail chegou?'), ['entao', 'o', 'email', 'chegou']);
});

test('numbers in digits or in words become the same token, once per number', () => {
  assert.deepEqual(comparableWords('três mil clientes'), ['#', 'clientes']);
  assert.deepEqual(comparableWords('3000 clientes'), ['#', 'clientes']);
  assert.deepEqual(comparableWords('vinte e cinco'), ['#']);
});

test('money and percent words are ignored', () => {
  assert.deepEqual(comparableWords('R$ 10 reais'), ['#']);
  assert.deepEqual(comparableWords('50% e cinquenta por cento'), ['#']);
});

test('the word error count is the edit distance, and the missed words come from the reference', () => {
  const result = wordErrors(['o', 'codigo', 'apodrece', 'rapido'], ['o', 'codico', 'apodrece']);
  assert.equal(result.errors, 2);
  assert.deepEqual(result.missed.sort(), ['codigo', 'rapido']);
});

test('the same words give no error', () => {
  assert.deepEqual(wordErrors(['a', 'b'], ['a', 'b']), { errors: 0, missed: [] });
});

test('extra heard words count as errors but are not missed reference words', () => {
  assert.deepEqual(wordErrors(['a'], ['a', 'b']), { errors: 1, missed: [] });
});
