import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translator } from '../../src/shared/i18n/translate.ts';
import { durationText } from '../../src/renderer/format.ts';

test('a duration preset reads in the interface language: seconds below a minute, then minutes and the seconds left', () => {
  const portuguese = translator('pt-BR');
  assert.equal(durationText(30, portuguese), '30 s');
  assert.equal(durationText(60, portuguese), '1 min');
  assert.equal(durationText(90, portuguese), '1 min 30 s');
  assert.equal(durationText(300, translator('en')), '5 min');
});
