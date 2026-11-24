import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VideoClock } from '../../../src/domain/video/VideoClock.ts';

test('the video gets a short silent lead-in and a tail around the timeline', () => {
  const clock = VideoClock.of(300);
  assert.equal(clock.leadIn(), 15);
  assert.equal(clock.durationInFrames(), 15 + 300 + 30);
});
test('a timeline frame lands lead-in frames later in the video', () => {
  assert.equal(VideoClock.of(300).toVideo(0), 15);
  assert.equal(VideoClock.of(300).toVideo(100), 115);
});
test('during the lead-in the timeline stays on its first frame; after it, it follows the video', () => {
  const clock = VideoClock.of(300);
  assert.equal(clock.toTimeline(0), 0);
  assert.equal(clock.toTimeline(14), 0);
  assert.equal(clock.toTimeline(15), 0);
  assert.equal(clock.toTimeline(16), 1);
  assert.equal(clock.toTimeline(340), 325);
});
test('an empty timeline still lasts at least one frame', () => {
  assert.equal(VideoClock.of(0).durationInFrames(), 45);
});
