import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clockText, lengthText, markAt } from '../../src/renderer/video/playhead.ts';

test('the clock shows minutes and seconds of the frames', () => {
  assert.equal(clockText(0, 30), '0:00');
  assert.equal(clockText(29, 30), '0:00');
  assert.equal(clockText(30 * 63, 30), '1:03');
  assert.equal(lengthText(59.6), '1:00');
});

test('the mark playing is the last one started; during the lead-in, the first', () => {
  const marks = [{ frame: 15, id: 'a' }, { frame: 100, id: 'b' }, { frame: 200, id: 'c' }];
  assert.equal(markAt(marks, 0)?.id, 'a');
  assert.equal(markAt(marks, 100)?.id, 'b');
  assert.equal(markAt(marks, 199)?.id, 'b');
  assert.equal(markAt(marks, 999)?.id, 'c');
  assert.equal(markAt([], 10), undefined);
});
