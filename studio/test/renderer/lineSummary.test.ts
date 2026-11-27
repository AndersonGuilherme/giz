import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beatCountOf, chipColorOf, excerptOf, problemCountOf, sceneTypeOf, SPEAKER_COLORS } from '../../src/renderer/editor/lineSummary.ts';
import type { LineJson } from '../../src/shared/script.ts';

const line = (fields: Partial<LineJson> & Record<string, unknown>): LineJson => ({ id: '01', chapter: 1, speaker: 'bia', text: '', ...fields });

test('the folded row shows the text on one line, cut on a word near 80 characters', () => {
  assert.equal(excerptOf('Oi,\n  tudo bem?'), 'Oi, tudo bem?');
  const long = 'Uma fala bem comprida que continua e continua até passar do limite de oitenta caracteres do resumo';
  const cut = excerptOf(long);
  assert.ok(cut.length <= 81, cut);
  assert.ok(cut.endsWith('…'));
  assert.ok(long.startsWith(cut.slice(0, -1)));
  assert.equal(cut.at(-2) === ' ', false, 'no space before the ellipsis');
  assert.equal(excerptOf('x'.repeat(100)).length, 81, 'one long word is cut where it must be');
  assert.equal(excerptOf('   '), '');
});

test('the row counts the beats, names the scene the line opens and counts its problems', () => {
  assert.equal(beatCountOf(line({ beats: [{}, {}] })), 2);
  assert.equal(beatCountOf(line({ beats: 'broken' })), 0);
  assert.equal(sceneTypeOf(line({ scene: { type: 'title' } })), 'title');
  assert.equal(sceneTypeOf(line({})), null);
  const problems = [{ line: 1, field: null, message: 'a' }, { line: 0, field: null, message: 'b' }, { line: 1, field: 'text', message: 'c' }, { line: null, field: null, message: 'd' }];
  assert.equal(problemCountOf(problems, 1), 2);
  assert.equal(problemCountOf(problems, 2), 0);
});

test('each speaker keeps the color of their place in the cast; someone unknown gets none', () => {
  const cast = ['bia', 'caio', 'narrador'];
  assert.equal(chipColorOf(cast, 'bia'), SPEAKER_COLORS[0]);
  assert.equal(chipColorOf(cast, 'caio'), SPEAKER_COLORS[1]);
  assert.equal(chipColorOf([...Array(SPEAKER_COLORS.length).keys()].map(String).concat('extra'), 'extra'), SPEAKER_COLORS[0], 'the colors go round');
  assert.equal(chipColorOf(cast, 'zeca'), null);
});
