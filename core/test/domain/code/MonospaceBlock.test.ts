import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MonospaceBlock } from '../../../src/domain/code/MonospaceBlock.ts';

// The 16:9 code window body: 1060 × 616 px, code at 34 px with rows of 1.5.
const AREA = { width: 1060, height: 616 };
const MEASURES = { size: 34, lineHeight: 1.5 };
const line = (length: number) => `  ${'x'.repeat(length - 2)}`;

test('short code keeps the base size', () => {
  const fitted = MonospaceBlock.fit([line(40), line(20)], AREA, MEASURES);
  assert.equal(fitted.fit.size, 34);
  assert.ok(fitted.fit.fits);
});

test('long lines shrink the letters to the width, as the motor did, down to 15 px (the SOLID code: up to 113 characters)', () => {
  const fitted = MonospaceBlock.fit([line(113), line(30)], AREA, MEASURES);
  assert.ok(fitted.fit.fits);
  assert.ok(fitted.fit.size >= 15 && fitted.fit.size <= 1060 / (113 * 0.6), String(fitted.fit.size));
  assert.deepEqual(fitted.fit.lines.length, 2, 'never wrapped');
});

test('27 lines of 98 characters fit the 16:9 window; 30 lines or 130 characters do not', () => {
  assert.ok(MonospaceBlock.fit(Array.from({ length: 27 }, () => line(98)), AREA, MEASURES).fit.fits);
  assert.equal(MonospaceBlock.fit(Array.from({ length: 30 }, () => line(40)), AREA, MEASURES).fit.fits, false);
  assert.equal(MonospaceBlock.fit([line(130)], AREA, MEASURES).fit.fits, false);
});
