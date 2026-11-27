import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shownAfter, type Shown } from '../../src/renderer/cast/characterSaves.ts';

const SAVED: Shown = { state: 'saved', problems: [], failure: null };
const failure = { code: 'failed' as const, message: 'Não deu para salvar cast/bia.json', details: ['EACCES'] };

test('a save that failed (no answer from core: the disk, the folder) is shown as failed, with its message', () => {
  const shown = shownAfter(SAVED, { status: 'failed', result: { ok: false, failure } });
  assert.deepEqual(shown, { state: 'failed', problems: [], failure });
});

test('saved and refused by the check as before; a change typed meanwhile shows waiting; a later save clears the failure', () => {
  const problems = [{ path: 'parameters.skin', message: 'cor inválida' }];
  const document = {} as never;
  assert.deepEqual(shownAfter(SAVED, { status: 'saved', result: { ok: true, value: { saved: false, problems, document } } }), { state: 'problems', problems, failure: null });
  assert.equal(shownAfter(SAVED, { status: 'pending' }).state, 'waiting');
  assert.equal(shownAfter(SAVED, { status: 'pending', result: { ok: false, failure } }).state, 'waiting');
  const failed = shownAfter(SAVED, { status: 'failed', result: { ok: false, failure } });
  assert.deepEqual(shownAfter(failed, { status: 'saved', result: { ok: true, value: { saved: true, problems: [], document } } }), SAVED);
});
