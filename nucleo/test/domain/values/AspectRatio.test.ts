import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

test('AspectRatio 9:16 is vertical 1080x1920', () => {
  const p = AspectRatio.of('9:16');
  assert.deepEqual([p.width(), p.height(), p.vertical()], [1080, 1920, true]);
});
test('AspectRatio rejects 4:3', () => assert.throws(() => AspectRatio.of('4:3'), /proporção "4:3"/));
