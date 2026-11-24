import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

test('the 9:16 safe area respects the Reels interface', () => {
  const a = SafeArea.for(AspectRatio.of('9:16'));
  assert.deepEqual([a.x, a.y, a.width, a.height], [86, 250, 908, 1248]);
});
test('the 16:9 safe area leaves 5% on each side', () => {
  const a = SafeArea.for(AspectRatio.of('16:9'));
  assert.deepEqual([a.x, a.y, a.width, a.height], [96, 54, 1728, 972]);
});
