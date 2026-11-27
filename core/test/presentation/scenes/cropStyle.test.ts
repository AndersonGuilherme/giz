import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cropStyle } from '../../../src/presentation/scenes/scenario/cropStyle.ts';

test('the render and the Studio draw a cropped picture with one style: the chosen part covers the box', () => {
  assert.deepEqual(cropStyle(undefined), { position: 'absolute', left: '0%', top: '0%', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 50%' });
  const zoomed = cropStyle({ zoom: 2, x: 1, y: 0 });
  assert.deepEqual([zoomed.left, zoomed.top, zoomed.width, zoomed.objectPosition], ['-100%', '0%', '200%', '100% 0%']);
});
