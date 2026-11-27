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

test('a count picks the plural form of the language (one, other, and an explicit zero), never "(s)"', () => {
  const portuguese = translator();
  assert.equal(portuguese('cast.lines', { count: 1 }), '1 fala');
  assert.equal(portuguese('cast.lines', { count: 3 }), '3 falas');
  assert.equal(portuguese('cast.lines', { count: 0 }), 'nenhuma fala');
  assert.equal(portuguese('voices.pending', { count: 2 }), '2 falas a gerar');
  assert.equal(portuguese('voices.pending', { count: 1 }), '1 fala a gerar');
  const english = translator('en');
  assert.equal(english('cast.lines', { count: 1 }), '1 line');
  assert.equal(english('cast.lines', { count: 2 }), '2 lines');
  assert.equal(english('cast.stillSpeaks', { id: 'ana', count: 1 }), '"ana" still says 1 line: change the speaker in the script before removing them.');
});

test('no S4 text says "(s)": every count has its plural forms', async () => {
  const media = (await import('../../src/shared/i18n/media.pt-BR.json', { with: { type: 'json' } })).default as Record<string, string>;
  const mediaEnglish = (await import('../../src/shared/i18n/media.en.json', { with: { type: 'json' } })).default as Record<string, string>;
  for (const [key, text] of [...Object.entries(media), ...Object.entries(mediaEnglish)]) assert.doesNotMatch(text, /\(s\)/, key);
});
