import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Language } from '../../../src/domain/values/Language.ts';
import { VisemeMap } from '../../../src/domain/speech/Visemes.ts';
import { EspeakPhonemizer } from '../../../src/infrastructure/phonetics/EspeakPhonemizer.ts';

test('espeak phonemizes pt-BR and en (integration)', async () => {
  const f = new EspeakPhonemizer();
  assert.match(await f.ipa('olá mundo', Language.PORTUGUESE), /ol/);
  assert.match(await f.ipa('hello world', Language.ENGLISH), /h/);
});
test('an English word in the middle of a pt-BR line does not break', async () => {
  const ipa = await new EspeakPhonemizer().ipa('fiz o deploy ontem', Language.PORTUGUESE);
  assert.ok(VisemeMap.for(Language.PORTUGUESE).convert(ipa).text().length > 8);
});
test('concurrent calls with different languages do not mix voices', async () => {
  const f = new EspeakPhonemizer();
  const [pt, en] = await Promise.all([f.ipa('olá', Language.PORTUGUESE), f.ipa('hello', Language.ENGLISH)]);
  assert.equal(pt, await f.ipa('olá', Language.PORTUGUESE));
  assert.equal(en, await f.ipa('hello', Language.ENGLISH));
});
test('in English æ stays a vowel (it does not become ɐ)', async () => {
  assert.match(await new EspeakPhonemizer().ipa('cat', Language.ENGLISH), /æ/);
});
test('keeps the punctuation between the chunks', async () => {
  assert.match(await new EspeakPhonemizer().ipa('olá, mundo.', Language.PORTUGUESE), /,.*\.$/);
});
