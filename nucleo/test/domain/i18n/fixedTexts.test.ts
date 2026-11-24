import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixedTexts } from '../../../src/domain/i18n/fixedTexts.ts';
import { ENGLISH } from '../../../src/domain/i18n/en.ts';
import { PORTUGUESE } from '../../../src/domain/i18n/pt-BR.ts';
import { Language } from '../../../src/domain/values/Language.ts';

const REQUIRED = ['objective', 'summary', 'challenge', 'nextLesson', 'findTheBug', 'rule', 'ticket', 'chapter', 'seconds'];

test('pt-BR and en have the same keys', () => {
  assert.deepEqual(Object.keys(fixedTexts(Language.PORTUGUESE)).sort(), Object.keys(fixedTexts(Language.ENGLISH)).sort());
});

test('each language comes from its own file and has every key of the brief, none empty', () => {
  assert.equal(fixedTexts(Language.PORTUGUESE), PORTUGUESE);
  assert.equal(fixedTexts(Language.ENGLISH), ENGLISH);
  for (const texts of [PORTUGUESE, ENGLISH]) {
    assert.deepEqual(REQUIRED.filter((key) => !(key in texts)), []);
    assert.ok(Object.values(texts).every((text) => text.trim().length > 0));
  }
});

test('the labels follow the language', () => {
  assert.equal(fixedTexts(Language.PORTUGUESE).objective, 'Objetivo');
  assert.equal(fixedTexts(Language.ENGLISH).objective, 'Objective');
  assert.equal(fixedTexts(Language.PORTUGUESE).findTheBug, 'Ache o bug');
  assert.equal(fixedTexts(Language.ENGLISH).nextLesson, 'Next lesson');
  assert.equal(fixedTexts(Language.PORTUGUESE).seconds, 'segundos');
});
