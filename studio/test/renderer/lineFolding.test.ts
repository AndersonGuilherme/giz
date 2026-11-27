import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addedLineOf, ALL_FOLDED, allOpened, isOpen, opened, toggled } from '../../src/renderer/editor/lineFolding.ts';

test('every line starts folded; opening one folds the one open before (one at a time)', () => {
  assert.equal(isOpen(ALL_FOLDED, '01'), false);
  const first = toggled(ALL_FOLDED, '01');
  assert.equal(isOpen(first, '01'), true);
  const second = toggled(first, '02');
  assert.deepEqual([isOpen(second, '01'), isOpen(second, '02')], [false, true]);
  assert.equal(isOpen(toggled(second, '02'), '02'), false, 'a second click folds it again');
  assert.equal(isOpen(opened(second, '02'), '02'), true, 'opening an open line keeps it open');
});

test('"expand all" opens every line and each one folds alone, until "collapse all" brings back one at a time', () => {
  const all = allOpened();
  assert.deepEqual(['01', '02', '99'].map((id) => isOpen(all, id)), [true, true, true]);
  const oneShut = toggled(all, '02');
  assert.deepEqual(['01', '02', '03'].map((id) => isOpen(oneShut, id)), [true, false, true], 'no accordion while all are open');
  assert.equal(isOpen(opened(oneShut, '02'), '02'), true);
  assert.equal(isOpen(toggled(oneShut, '02'), '02'), true);
  const back = toggled(ALL_FOLDED, '01');
  assert.equal(isOpen(toggled(back, '03'), '01'), false);
});

test('the line just added is the one new id when the list grew by one; anything else is no new line', () => {
  assert.equal(addedLineOf(['01', '02'], ['01', '02', '03']), '03');
  assert.equal(addedLineOf(['01', '02'], ['01', '04', '02']), '04', 'a line inserted in the middle or a copy');
  assert.equal(addedLineOf(null, ['01', '02']), null, 'the script opening is no new line');
  assert.equal(addedLineOf(['01', '02'], ['02', '01']), null, 'a move');
  assert.equal(addedLineOf(['01', '02'], ['01']), null, 'a removal');
  assert.equal(addedLineOf(['01'], ['01', '02', '03']), null, 'a reload with many new lines');
});
