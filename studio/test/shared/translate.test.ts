import { test } from 'node:test';
import assert from 'node:assert/strict';
import portuguese from '../../src/shared/i18n/pt-BR.json' with { type: 'json' };
import english from '../../src/shared/i18n/en.json' with { type: 'json' };
import { translator } from '../../src/shared/i18n/translate.ts';

test('pt-BR is the default and both languages have the same keys', () => {
  assert.equal(translator()('project.open'), 'Abrir projeto');
  assert.equal(translator('en')('project.open'), 'Open project');
  assert.deepEqual(Object.keys(english).sort(), Object.keys(portuguese).sort());
});

test('each {name} is replaced by its value; a missing value keeps the placeholder', () => {
  const translate = translator();
  assert.equal(translate('render.running', { percent: 42 }), 'Renderizando… 42%');
  assert.equal(translate('errors.aspect', { project: '16:9' }), 'Este projeto é 16:9, não {asked}.');
});
