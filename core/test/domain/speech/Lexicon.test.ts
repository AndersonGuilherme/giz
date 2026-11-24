import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Lexicon } from '../../../src/domain/speech/Lexicon.ts';

test('replaces whole words, ignoring case, and leaves the rest of the text as written', () => {
  const lexicon = Lexicon.of({ deploy: 'diplói', 'e-mails': 'iméios' });
  assert.equal(lexicon.apply('Fiz o Deploy e mandei três mil e-mails.'), 'Fiz o diplói e mandei três mil iméios.');
});

test('a word inside another word is not replaced (letters around it, accents included)', () => {
  const lexicon = Lexicon.of({ api: 'ei pi ai' });
  assert.equal(lexicon.apply('a rapidez da API'), 'a rapidez da ei pi ai');
  assert.equal(lexicon.apply('apiário'), 'apiário');
  assert.equal(lexicon.apply('éapi'), 'éapi');
});

test('special characters in the key are literal, not a pattern', () => {
  const lexicon = Lexicon.of({ 'C++': 'cê mais mais', 'a.b': 'a ponto b' });
  assert.equal(lexicon.apply('C++ e a.b, não axb'), 'cê mais mais e a ponto b, não axb');
});

test('the entries apply in the order of the file, each on the result of the previous one', () => {
  const lexicon = Lexicon.of({ GPT: 'gê pê tê', 'gê pê tê': 'chat' });
  assert.equal(lexicon.apply('o GPT'), 'o chat');
});

test('the empty lexicon changes nothing', () => {
  assert.equal(Lexicon.EMPTY.apply('Oi, eu sou a Ana.'), 'Oi, eu sou a Ana.');
});
