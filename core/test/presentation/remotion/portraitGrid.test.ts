import { test } from 'node:test';
import assert from 'node:assert/strict';
import { portraitCorner, portraitSheetSize } from '../../../src/presentation/remotion/portraitGrid.ts';

test('the portrait picture is exactly as big as its cells: full rows, the last one partial', () => {
  assert.deepEqual(portraitSheetSize(10, { cell: 160, columns: 8 }), { width: 1280, height: 320 });
  assert.deepEqual(portraitSheetSize(0, { cell: 100, columns: 4 }), { width: 400, height: 100 });
});

test('each portrait is placed left to right, then on the next row', () => {
  assert.deepEqual(portraitCorner(0, { cell: 160, columns: 8 }), { left: 0, top: 0 });
  assert.deepEqual(portraitCorner(9, { cell: 160, columns: 8 }), { left: 160, top: 160 });
});
