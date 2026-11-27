import { test } from 'node:test';
import assert from 'node:assert/strict';
import { edited, HISTORY_LIMIT, historyOf, redone, undone } from '../../src/renderer/editor/editorHistory.ts';
import type { ScriptJson } from '../../src/shared/script.ts';

const version = (text: string): ScriptJson => ({ chapters: ['x'], lines: [{ id: '01', chapter: 1, speaker: 'a', text }] });
const textOf = (script: ScriptJson) => script.lines[0]!.text;

test('undo goes back step by step, redo comes forward, and a new edit drops the redo steps', () => {
  let history = historyOf(version('a'));
  history = edited(history, version('b'));
  history = edited(history, version('c'));
  history = undone(history);
  assert.equal(textOf(history.present), 'b');
  history = undone(history);
  assert.equal(textOf(history.present), 'a');
  assert.equal(undone(history), history, 'nothing before the first version');
  history = redone(history);
  assert.equal(textOf(history.present), 'b');
  history = edited(history, version('d'));
  assert.deepEqual(history.future, []);
  assert.equal(redone(history), history);
});

test('typing in the same field is one step; another field, or a pause, is a new step', () => {
  let history = historyOf(version(''));
  history = edited(history, version('o'), { key: '0.text', at: 1000 });
  history = edited(history, version('oi'), { key: '0.text', at: 1300 });
  assert.equal(history.past.length, 1);
  history = edited(history, version('oi!'), { key: '0.text', at: 4000 });
  assert.equal(history.past.length, 2);
  history = edited(history, version('oi!?'), { key: '0.pose', at: 4100 });
  assert.equal(history.past.length, 3);
  assert.equal(textOf(undone(history).present), 'oi!');
});

test('at least the last 50 edits can be undone (the oldest beyond the limit are dropped)', () => {
  let history = historyOf(version('0'));
  for (let step = 1; step <= HISTORY_LIMIT + 20; step++) history = edited(history, version(String(step)));
  assert.ok(HISTORY_LIMIT >= 50);
  assert.equal(history.past.length, HISTORY_LIMIT);
  for (let step = 0; step < 50; step++) history = undone(history);
  assert.equal(textOf(history.present), String(HISTORY_LIMIT + 20 - 50));
});
