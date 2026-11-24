import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixedTexts } from '../../../src/domain/i18n/fixedTexts.ts';
import { Language } from '../../../src/domain/values/Language.ts';

test('pt-BR and en have the same keys', () => {
  assert.deepEqual(Object.keys(fixedTexts(Language.PORTUGUESE)).sort(), Object.keys(fixedTexts(Language.ENGLISH)).sort());
});

test('the card labels follow the language', () => {
  assert.equal(fixedTexts(Language.PORTUGUESE).objective, 'Objetivo');
  assert.equal(fixedTexts(Language.ENGLISH).objective, 'Objective');
  assert.equal(fixedTexts(Language.PORTUGUESE).findTheBug, 'Ache o bug');
});
