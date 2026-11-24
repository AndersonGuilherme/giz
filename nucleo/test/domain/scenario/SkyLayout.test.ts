import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SkyLayout } from '../../../src/domain/scenario/SkyLayout.ts';
import { HudLayout } from '../../../src/domain/scenario/HudLayout.ts';
import { Placement } from '../../../src/domain/scenario/Placement.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

const FULL_HUD = { fields: [{ label: 'DIA', value: '3' }, { label: 'SEM', value: 'WI-FI' }], bar: { label: 'PACIÊNCIA', value: 40 } };

for (const text of ['9:16', '16:9'] as const) {
  test(`${text}: the moon never sits under the HUD panel`, () => {
    const aspect = AspectRatio.of(text);
    const moon = SkyLayout.moon(aspect);
    const { panel } = HudLayout.for(FULL_HUD, aspect);
    const nearestX = Math.max(panel.x, Math.min(moon.x, panel.x + panel.width));
    const nearestY = Math.max(panel.y, Math.min(moon.y, panel.y + panel.height));
    assert.ok(Math.hypot(moon.x - nearestX, moon.y - nearestY) > moon.radius, `moon at ${moon.x},${moon.y} r ${moon.radius}`);
  });

  test(`${text}: the moon stays in the sky, inside the frame and above the ground`, () => {
    const aspect = AspectRatio.of(text);
    const moon = SkyLayout.moon(aspect);
    assert.ok(moon.x + moon.radius < aspect.width() && moon.x - moon.radius > 0);
    assert.ok(moon.y + moon.radius < Placement.groundOf(aspect) - 300);
  });
}

test('16:9 keeps the moon where it was (right third, high), it only moves when the HUD is in the way', () => {
  const aspect = AspectRatio.of('16:9');
  const moon = SkyLayout.moon(aspect);
  assert.equal(moon.x, aspect.width() * 0.75);
  assert.equal(moon.y, Placement.groundOf(aspect) * 0.3);
});
