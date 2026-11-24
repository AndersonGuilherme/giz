import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Language } from '../../../src/domain/values/Language.ts';

test('Language accepts pt-BR and en and gives the espeak voice', () => {
  assert.equal(Language.of('pt-BR').espeakVoice(), 'pt-br');
  assert.equal(Language.of('en').espeakVoice(), 'en-us');
  assert.ok(Language.of('en').equals(Language.ENGLISH));
});
test('Language rejects an unknown code with a readable message', () => {
  assert.throws(() => Language.of('es'), { name: 'DomainError', message: /idioma "es" não suportado.*pt-BR.*en/ });
});
