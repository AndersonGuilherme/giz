import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Fps, Frame, Seconds } from '../../../src/domain/values/Time.ts';

test('1.5 s at 30 fps is 45 frames; 1.51 s rounds up to 46', () => {
  assert.equal(Seconds.of(1.5).toFrames(Fps.DEFAULT).value(), 45);
  assert.equal(Seconds.of(1.51).toFrames(Fps.DEFAULT).value(), 46);
});
test('Frame never goes negative', () => assert.equal(Frame.of(3).minus(Frame.of(5)).value(), 0));
test('Frame rejects a fraction and a negative', () => {
  assert.throws(() => Frame.of(1.5));
  assert.throws(() => Frame.of(-1));
});
test('Seconds adds and rejects a negative', () => {
  assert.equal(Seconds.of(1).plus(Seconds.of(0.5)).value(), 1.5);
  assert.throws(() => Seconds.of(-1), /segundos/);
});
test('Frame adds and compares', () => {
  assert.equal(Frame.of(2).plus(Frame.of(3)).value(), 5);
  assert.ok(Frame.of(2).isBefore(Frame.of(3)));
  assert.ok(!Frame.of(3).isBefore(Frame.of(3)));
});
test('the default Fps is 30', () => assert.equal(Fps.DEFAULT.value(), 30));
test('a zero or tiny duration becomes a positive frame 0, never -0', () => {
  assert.ok(Object.is(Seconds.of(0).toFrames(Fps.DEFAULT).value(), 0));
  assert.ok(Object.is(Seconds.of(1e-12).toFrames(Fps.DEFAULT).value(), 0));
});
test('a frame converts to the instant where it starts', () => {
  assert.equal(Frame.of(45).toSeconds(Fps.DEFAULT).value(), 1.5);
  assert.equal(Frame.of(0).toSeconds(Fps.DEFAULT).value(), 0);
});
