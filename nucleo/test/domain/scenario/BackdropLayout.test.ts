import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BackdropLayout, FOCUS_RADIUS, FRONT_PROP, type Corner } from '../../../src/domain/scenario/BackdropLayout.ts';
import { HudLayout } from '../../../src/domain/scenario/HudLayout.ts';
import { TALLEST_HUD } from '../../../src/domain/scenario/SkyLayout.ts';
import { Placement } from '../../../src/domain/scenario/Placement.ts';
import type { Rectangle } from '../../../src/domain/layout/Box.ts';
import type { CharacterInScene } from '../../../src/domain/script/Scene.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';

const ASPECTS = ['9:16', '16:9'] as const;

const propBox = (corner: Corner): Rectangle => ({
  x: corner.x - (FRONT_PROP.width / 2) * corner.scale,
  y: corner.y - FRONT_PROP.height * corner.scale,
  width: FRONT_PROP.width * corner.scale,
  height: FRONT_PROP.height * corner.scale,
});

const overlap = (first: Rectangle, second: Rectangle) =>
  first.x < second.x + second.width && second.x < first.x + first.width && first.y < second.y + second.height && second.y < first.y + first.height;

const contains = (outer: Rectangle, x: number, y: number) =>
  x >= outer.x - 1e-6 && x <= outer.x + outer.width + 1e-6 && y >= outer.y - 1e-6 && y <= outer.y + outer.height + 1e-6;

for (const text of ASPECTS) {
  const aspect = AspectRatio.of(text);

  test(`${text}: the ground is the characters' floor and the horizon sits 150 units above it, both in the frame`, () => {
    const backdrop = BackdropLayout.for(aspect);
    assert.equal(backdrop.ground, Placement.groundOf(aspect));
    assert.equal(backdrop.unit, 1.08);
    assert.ok(Math.abs(backdrop.ground - backdrop.horizon - 150 * backdrop.unit) < 1e-9);
    assert.ok(backdrop.horizon > 0 && backdrop.ground < aspect.height());
  });

  test(`${text}: the stage holds the feet and the head of every character at the named positions`, () => {
    const { stage } = BackdropLayout.for(aspect);
    const crowds: CharacterInScene[][] = [
      [{ character: 'ana', position: 'center' }],
      [{ character: 'ana', position: 'left' }, { character: 'bia', position: 'right' }],
    ];
    if (!aspect.vertical()) crowds.push([...crowds[1]!, { character: 'caio', position: 'center' }]);
    for (const spot of crowds.flatMap((crowd) => Placement.for(crowd, aspect))) {
      assert.ok(contains(stage, spot.x, spot.y), `feet of ${spot.character} at ${spot.x},${spot.y}`);
      assert.ok(contains(stage, spot.x, spot.y - spot.height), `head of ${spot.character}`);
    }
    assert.ok(stage.x > 0 && stage.x + stage.width < aspect.width(), 'the stage leaves both sides of the frame free');
  });

  test(`${text}: a front prop in either corner never covers the stage, and is still large enough to read`, () => {
    const { stage, corners, unit } = BackdropLayout.for(aspect);
    for (const corner of [corners.left, corners.right]) {
      assert.ok(!overlap(propBox(corner), stage), `${JSON.stringify(corner)} covers the stage`);
      assert.ok(corner.scale >= 0.8 * unit && corner.scale <= unit, `scale ${corner.scale}`);
      assert.equal(corner.y, aspect.height());
    }
    assert.equal(corners.left.x, 0);
    assert.equal(corners.right.x, aspect.width());
  });
}

test('9:16 has a taller sky above the horizon than 16:9 (the backgrounds stack their scenery higher there)', () => {
  const [vertical, horizontal] = ASPECTS.map((text) => BackdropLayout.for(AspectRatio.of(text)));
  assert.ok(vertical!.horizon / vertical!.unit > 1.3 * (horizontal!.horizon / horizontal!.unit));
});

test("16:9: the focus (the background's main feature) sits between the two characters, above the horizon", () => {
  const aspect = AspectRatio.of('16:9');
  const { focus, unit, horizon } = BackdropLayout.for(aspect);
  const radius = FOCUS_RADIUS * unit;
  const [left, right] = Placement.for([{ character: 'ana', position: 'left' }, { character: 'bia', position: 'right' }], aspect);
  assert.ok(focus.x - radius > left!.x + 0.32 * left!.height, 'clear of the left character');
  assert.ok(focus.x + radius < right!.x - 0.32 * right!.height, 'clear of the right character');
  assert.ok(focus.y + radius < horizon);
});

test("9:16: the focus sits above the characters' heads and below the HUD panel", () => {
  const aspect = AspectRatio.of('9:16');
  const { focus, unit, stage } = BackdropLayout.for(aspect);
  const radius = FOCUS_RADIUS * unit;
  const { panel } = HudLayout.for(TALLEST_HUD, aspect);
  assert.equal(focus.x, aspect.width() / 2);
  assert.ok(focus.y - radius > panel.y + panel.height, 'below the HUD');
  assert.ok(focus.y < stage.y, 'its center is above the heads');
});

test('16:9: a wide focus feature (focusWidth) stays clear of both characters and is at least the focus disc', () => {
  const aspect = AspectRatio.of('16:9');
  const { focus, focusWidth, unit } = BackdropLayout.for(aspect);
  const [left, right] = Placement.for([{ character: 'ana', position: 'left' }, { character: 'bia', position: 'right' }], aspect);
  assert.ok(focus.x - focusWidth / 2 > left!.x + 0.32 * left!.height, 'clear of the left character');
  assert.ok(focus.x + focusWidth / 2 < right!.x - 0.32 * right!.height, 'clear of the right character');
  assert.ok(focusWidth >= 2 * FOCUS_RADIUS * unit);
});

test('9:16: the focus feature, above the heads, may span the frame but keeps a margin on both sides', () => {
  const aspect = AspectRatio.of('9:16');
  const { focus, focusWidth, unit } = BackdropLayout.for(aspect);
  assert.ok(focus.x - focusWidth / 2 >= 150 * unit - 1e-9 && focus.x + focusWidth / 2 <= aspect.width() - 150 * unit + 1e-9);
  assert.ok(focusWidth > 2 * FOCUS_RADIUS * unit);
});
