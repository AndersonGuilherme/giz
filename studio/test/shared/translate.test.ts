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
  assert.equal(translate('video.renderTitle'), 'Renderizar em {aspect}');
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

test('no text of any area says "(s)": every count has its plural forms', async () => {
  const { readdir, readFile } = await import('node:fs/promises');
  const folder = new URL('../../src/shared/i18n/', import.meta.url);
  const files = (await readdir(folder)).filter((name) => name.endsWith('.json'));
  assert.equal(files.length, 10);
  const texts = await Promise.all(files.map(async (name) => [name, JSON.parse(await readFile(new URL(name, folder), 'utf8')) as Record<string, string>] as const));
  const entries = texts.flatMap(([name, each]) => Object.entries(each).map(([key, text]) => [`${name}: ${key}`, text] as const));
  for (const [key, text] of entries) assert.doesNotMatch(text, /\(s\)/, key);
});

test('the S2, S3 and S5 counts have their plural forms too', () => {
  const [portuguese, english] = [translator(), translator('en')];
  assert.equal(portuguese('video.missingVoiceLines', { count: 1, lines: '3' }), 'Sem voz: 1 fala (3)');
  assert.equal(english('video.checkErrors', { count: 2, aspect: '9:16' }), 'The check in 9:16 found 2 errors. Fix them in the script before rendering.');
  assert.equal(portuguese('idea.moreProblems', { count: 1 }), 'e mais 1 problema');
  assert.equal(portuguese('check.summary', { errors: 1, warnings: 2 }), 'Erros: 1 · avisos: 2');
});
