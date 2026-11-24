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

// Every crowd a scene can have at the named positions (what the backdrop's stage is made of).
const CROWDS = {
  '9:16': [[{ character: 'a', position: 'left' }, { character: 'b', position: 'right' }], [{ character: 'a', position: 'center' }]],
  '16:9': [
    [{ character: 'a', position: 'left' }, { character: 'b', position: 'right' }],
    [{ character: 'a', position: 'left' }, { character: 'b', position: 'right' }, { character: 'c', position: 'center' }],
    [{ character: 'a', position: 'right' }],
  ],
} as const;

for (const text of ['9:16', '16:9'] as const) {
  test(`${text}: the moon never sits behind a character spot (graveyard, night-sky, city-night)`, () => {
    const aspect = AspectRatio.of(text);
    const moon = SkyLayout.moon(aspect);
    const spots = CROWDS[text].flatMap((crowd) => Placement.for(crowd, aspect));
    for (const spot of spots) {
      const top = spot.y - spot.height;
      assert.ok(moon.y + moon.radius < top, `${text} ${spot.character} at ${spot.x}: moon bottom ${moon.y + moon.radius} vs head top ${top}`);
    }
  });
}

test('16:9 keeps the moon in the right third, raised above the heads of the stage (it used to sit behind the right character)', () => {
  const aspect = AspectRatio.of('16:9');
  const moon = SkyLayout.moon(aspect);
  assert.equal(moon.x, aspect.width() * 0.75);
  assert.ok(moon.y < Placement.groundOf(aspect) * 0.3);
  assert.ok(moon.y - moon.radius > 0);
});
