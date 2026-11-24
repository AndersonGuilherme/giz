import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Body, type BodyContext } from '../../../src/domain/character/Body.ts';
import { Fps, Frame } from '../../../src/domain/values/Time.ts';

const base: BodyContext = { pose: 'neutral', poseStart: Frame.of(0), speaking: false, opening: 0, phase: 0, fps: Fps.DEFAULT };
const body = new Body();

test('breathing stays within ±2 px and neither rotates nor scales', () => {
  for (let number = 0; number < 300; number += 7) {
    const d = body.offsetAt(Frame.of(number), base);
    assert.ok(Math.abs(d.y) <= 2 + 1e-9);
    assert.equal(d.rotation, 0);
    assert.equal(d.scale, 1);
  }
});
test('the volume pulls the body up to 5 px, with light rotation and scale', () => {
  const silent = body.offsetAt(Frame.of(30), base);
  const speaking = body.offsetAt(Frame.of(30), { ...base, speaking: true, opening: 1 });
  assert.ok(Math.abs(speaking.y - (silent.y - 5)) < 1e-9);
  assert.ok(Math.abs(speaking.scale - 1.006) < 1e-9);
  assert.ok(Math.abs(speaking.rotation) <= 0.6);
});
test('when not speaking, the opening is ignored', () => {
  assert.deepEqual(body.offsetAt(Frame.of(30), { ...base, opening: 1 }), body.offsetAt(Frame.of(30), base));
});
test('celebrate rises 18 px once, halfway through 0.5 s', () => {
  const context = { ...base, pose: 'celebrate' } as const;
  const still = body.offsetAt(Frame.of(15), base);
  const peak = body.offsetAt(Frame.of(15), { ...context, poseStart: Frame.of(7) });
  assert.ok(peak.y < still.y - 17);
});
test('the pose gesture happens once: 2 s after the start only breathing is left', () => {
  for (const pose of ['celebrate', 'raise', 'wave', 'explain', 'point', 'shrug', 'hand-on-head', 'hands-on-mouth'] as const) {
    const later = body.offsetAt(Frame.of(90), { ...base, pose, poseStart: Frame.of(30) });
    assert.deepEqual(later, body.offsetAt(Frame.of(90), base), pose);
  }
});
test('wave swings and settles; think keeps the head tilted', () => {
  const waving = body.offsetAt(Frame.of(5), { ...base, pose: 'wave' });
  assert.ok(Math.abs(waving.rotation) > 0.5);
  const thinkingFace = body.offsetAt(Frame.of(600), { ...base, pose: 'think' });
  assert.ok(thinkingFace.rotation > 1.3);
});
test('phase changes the breathing', () => {
  assert.notEqual(body.offsetAt(Frame.of(30), base).y, body.offsetAt(Frame.of(30), { ...base, phase: 1.7 }).y);
});
