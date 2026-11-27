import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addChapter, addLine, duplicateLine, moveLine, nextLineId, removeChapter, removeLine, renameChapter, withField } from '../../src/renderer/editor/scriptEdits.ts';
import type { ScriptJson } from '../../src/shared/script.ts';

const SCRIPT: ScriptJson = {
  chapters: ['Um', 'Dois'],
  lines: [
    { id: '01', chapter: 1, speaker: 'bia', text: 'Oi.', scene: { type: 'talk' } },
    { id: '02', chapter: 1, speaker: 'caio', text: 'Tudo bem?', pose: 'wave' },
    { id: '03', chapter: 2, speaker: 'bia', text: 'Tchau.' },
  ],
};
const ids = (script: ScriptJson) => script.lines.map(({ id }) => id);

test('a field is set, and an undefined value removes it; the other lines stay the same objects', () => {
  const set = withField(SCRIPT, { index: 1, field: 'expression', value: 'happy' });
  assert.equal(set.lines[1]!.expression, 'happy');
  assert.equal(set.lines[0], SCRIPT.lines[0]);
  const removed = withField(SCRIPT, { index: 1, field: 'pose', value: undefined });
  assert.equal('pose' in removed.lines[1]!, false);
  assert.equal(SCRIPT.lines[1]!.pose, 'wave', 'the script is never changed in place');
});

test('new ids keep counting with the same width, and skip ids already taken', () => {
  assert.equal(nextLineId(SCRIPT), '04');
  assert.equal(nextLineId({ chapters: [], lines: [] }), '01');
  assert.equal(nextLineId({ chapters: ['x'], lines: [{ id: '009', chapter: 1, speaker: 'a', text: 'x' }, { id: 'intro', chapter: 1, speaker: 'a', text: 'x' }] }), '010');
});

test('a line is added after another, in its chapter, with its speaker; −1 adds at the start', () => {
  const added = addLine(SCRIPT, 1, 'Nova fala.');
  assert.deepEqual(ids(added), ['01', '02', '04', '03']);
  assert.deepEqual(added.lines[2], { id: '04', chapter: 1, speaker: 'caio', text: 'Nova fala.' });
  assert.deepEqual(ids(addLine(SCRIPT, -1, 'x')), ['04', '01', '02', '03']);
  assert.deepEqual(addLine({ chapters: ['x'], lines: [] }, -1, 'x').lines, [{ id: '01', chapter: 1, speaker: '', text: 'x' }]);
});

test('a duplicate comes right after, with a new id and without the scene', () => {
  const copy = duplicateLine(SCRIPT, 0);
  assert.deepEqual(ids(copy), ['01', '04', '02', '03']);
  assert.deepEqual(copy.lines[1], { id: '04', chapter: 1, speaker: 'bia', text: 'Oi.' });
});

test('lines are removed and moved (up, down, by drag)', () => {
  assert.deepEqual(ids(removeLine(SCRIPT, 1)), ['01', '03']);
  assert.deepEqual(ids(moveLine(SCRIPT, 2, 0)), ['03', '01', '02']);
  assert.deepEqual(ids(moveLine(SCRIPT, 0, 1)), ['02', '01', '03']);
  assert.equal(moveLine(SCRIPT, 0, -1), SCRIPT);
  assert.equal(moveLine(SCRIPT, 2, 3), SCRIPT);
});

test('chapters are renamed, added and removed; the lines of a removed chapter join the one before', () => {
  assert.deepEqual(renameChapter(SCRIPT, 1, 'Fim').chapters, ['Um', 'Fim']);
  assert.deepEqual(addChapter(SCRIPT, 'Três').chapters, ['Um', 'Dois', 'Três']);
  const second = removeChapter(SCRIPT, 1);
  assert.deepEqual(second.chapters, ['Um']);
  assert.deepEqual(second.lines.map(({ chapter }) => chapter), [1, 1, 1]);
  const first = removeChapter(SCRIPT, 0);
  assert.deepEqual(first.chapters, ['Dois']);
  assert.deepEqual(first.lines.map(({ chapter }) => chapter), [1, 1, 1]);
});
