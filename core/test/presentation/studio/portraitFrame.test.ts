import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gizzyDefinition } from '../../../src/presentation/rigs/gizzy/parameters.ts';
import { portraitFrame } from '../../../src/presentation/studio/portraitFrame.ts';

const stance = { viewBox: { x: -60, y: -30, width: 520, height: 630 }, feet: { x: 200, y: 560 } };

test('a head that stays in the view box: the square from its top down to the shoulders, centered on the body', () => {
  const frame = portraitFrame(stance);
  assert.equal(frame.y, -30);
  assert.equal(frame.width, frame.height);
  assert.equal(frame.x + frame.width / 2, 200);
});

test('a tall hat above the view box: the frame starts above the hat top and still ends at the shoulders', () => {
  const plain = portraitFrame(stance);
  const tall = portraitFrame({ ...stance, top: -110 });
  assert.ok(tall.y < -110, `the hat top (-110) is inside the frame, from ${tall.y}`);
  assert.equal(tall.y + tall.height, plain.y + plain.height);
  assert.equal(tall.x + tall.width / 2, 200);
});

test("the gizzy rig's real reach: the chef hat and the knight's plume reach above the view box, and the frame holds them", () => {
  const top = (headwear: string) => gizzyDefinition.reach!({ headwear });
  for (const headwear of ['chef-hat', 'knight-helmet']) {
    const reach = top(headwear);
    assert.ok(reach < gizzyDefinition.stance.viewBox.y, `${headwear} goes above the view box (${reach})`);
    assert.ok(portraitFrame({ ...gizzyDefinition.stance, top: reach }).y < reach);
  }
});
