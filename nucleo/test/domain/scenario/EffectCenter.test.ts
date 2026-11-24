import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EffectCenter } from '../../../src/domain/scenario/EffectCenter.ts';
import { Placement } from '../../../src/domain/scenario/Placement.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

const HORIZONTAL = AspectRatio.of('16:9');
const VERTICAL = AspectRatio.of('9:16');

test('a given position is a fraction of the frame', () => {
  assert.deepEqual(EffectCenter.of({ type: 'glow', position: { x: 0.25, y: 0.5 } }, HORIZONTAL), { x: 480, y: 540 });
});

test('without a position, the fire burns on the floor on the right, clear of the characters and of a zoom-in crop', () => {
  for (const aspect of [HORIZONTAL, VERTICAL]) {
    const fire = EffectCenter.of({ type: 'fire' }, aspect);
    assert.ok(fire.x > aspect.width() * 0.8, aspect.text());
    assert.ok(Math.abs(fire.y - Placement.groundOf(aspect)) <= aspect.height() * 0.05, 'near the floor line');
    const zoomed = aspect.height() / 2 + (fire.y - aspect.height() / 2) * 1.3;
    assert.ok(zoomed < aspect.height(), `the base stays in the frame at zoom 1.3 (${aspect.text()})`);
  }
});

test('without a position, a glow lights the upper middle and the others take the center', () => {
  assert.deepEqual(EffectCenter.of({ type: 'glow' }, HORIZONTAL), { x: 960, y: 0.35 * 1080 });
  assert.deepEqual(EffectCenter.of({ type: 'vignette' }, VERTICAL), { x: 540, y: 960 });
});
