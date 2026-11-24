import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Motion } from '../../../src/domain/lesson/Motion.ts';
import { Reveal } from '../../../src/domain/lesson/Reveal.ts';
import { Typing } from '../../../src/domain/lesson/Typing.ts';
import { Fps } from '../../../src/domain/values/Time.ts';

const FPS = Fps.DEFAULT;

test('pop starts at 0, overshoots a little and settles at 1, like the motor spring', () => {
  assert.equal(Motion.pop(0, FPS), 0);
  const samples = Array.from({ length: 40 }, (_, frame) => Motion.pop(frame, FPS));
  assert.ok(Math.max(...samples) > 1 && Math.max(...samples) < 1.05);
  assert.ok(Math.abs(Motion.pop(60, FPS) - 1) < 0.001);
  assert.equal(Motion.pop(-5, FPS), 0, 'before its delay it has not started');
});

test('fade up: transparent and 24 px below at 0, in place at 1', () => {
  assert.deepEqual(Motion.fadeUp(0), { opacity: 0, shift: 24 });
  assert.deepEqual(Motion.fadeUp(1), { opacity: 1, shift: 0 });
});

test('ramp is linear between two frames and clamped outside', () => {
  assert.equal(Motion.ramp(5, [10, 20]), 0);
  assert.equal(Motion.ramp(15, [10, 20]), 0.5);
  assert.equal(Motion.ramp(25, [10, 20]), 1);
  assert.equal(Motion.easeInOutCubic(0.5), 0.5);
});

test('reveal: hidden items wait, the newest pops in, the older ones are settled', () => {
  const reveal = Reveal.of({ shown: 2, animatesNewest: true });
  assert.equal(reveal.isVisible(2), false);
  assert.equal(reveal.progressAt(2, 30, FPS), 0);
  assert.equal(reveal.progressAt(0, 0, FPS), 1);
  assert.equal(reveal.progressAt(1, 0, FPS), 0);
  assert.ok(reveal.progressAt(1, 6, FPS) > 0.5);
});

test('reveal without the newest animation shows every visible item settled', () => {
  const reveal = Reveal.of({ shown: 2, animatesNewest: false });
  assert.equal(reveal.progressAt(1, 0, FPS), 1);
});

test('typing: the command is typed after 6 frames, about one character per frame', () => {
  const typing = Typing.of('npm test');
  assert.equal(typing.typedAt(0), '');
  assert.equal(typing.typedAt(6 + 4), 'npm ');
  assert.equal(typing.typedAt(100), 'npm test');
  assert.equal(typing.cursorVisible(0), true);
  assert.equal(typing.cursorVisible(15), false);
});

test('typing: output line i fades in from frame 7i of the last change', () => {
  assert.equal(Typing.lineOpacity(1, 6), 0);
  assert.equal(Typing.lineOpacity(1, 12), 1);
  assert.equal(Typing.lineOpacity(0, 0), 0);
});
