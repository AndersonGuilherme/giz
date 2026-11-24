import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CameraMove } from '../../../src/domain/camera/CameraMove.ts';
import { Frame } from '../../../src/domain/values/Time.ts';

test('zoom-in goes from zoom 1 to 1.3 and never below 1', () => {
  const m = CameraMove.of({ type: 'zoom-in', to: { x: 0, y: 0, zoom: 1.3 } });
  assert.equal(m.framingAt(0, Frame.of(0)).zoom, 1);
  assert.equal(m.framingAt(1, Frame.of(90)).zoom, 1.3);
  assert.ok(m.framingAt(0.5, Frame.of(45)).zoom >= 1);
});
test('pan never shows the edge: x is limited by the zoom slack', () => {
  const m = CameraMove.of({ type: 'pan', from: { x: -1, y: 0, zoom: 1.1 }, to: { x: 1, y: 0, zoom: 1.1 } });
  const e = m.framingAt(1, Frame.of(0));
  assert.ok(Math.abs(e.x) <= (1.1 - 1) / 2 + 1e-9);
  assert.ok(Math.abs(m.framingAt(0, Frame.of(0)).x) <= (1.1 - 1) / 2 + 1e-9);
});
test('zoom below 1 becomes 1 and y also respects the slack', () => {
  const m = CameraMove.of({ type: 'still', from: { x: 0.5, y: 0.5, zoom: 0.5 } });
  const e = m.framingAt(0, Frame.of(0));
  assert.equal(e.zoom, 1);
  assert.equal(e.x, 0);
  assert.equal(e.y, 0);
});
test('an unknown camera type lists the valid ones', () => {
  assert.throws(() => CameraMove.of({ type: 'girar' } as never), /zoom-in.*shake/);
});
test('zoom-out goes the other way: from 1.3 to 1', () => {
  const m = CameraMove.of({ type: 'zoom-out' });
  assert.equal(m.framingAt(0, Frame.of(0)).zoom, 1.3);
  assert.equal(m.framingAt(1, Frame.of(0)).zoom, 1);
});
test('linear is proportional and smooth is ease-in-out', () => {
  const to = { x: 0, y: 0, zoom: 1.4 };
  const linear = CameraMove.of({ type: 'zoom-in', to, easing: 'linear' });
  const smooth = CameraMove.of({ type: 'zoom-in', to, easing: 'smooth' });
  assert.ok(Math.abs(linear.framingAt(0.25, Frame.of(0)).zoom - 1.1) < 1e-9);
  assert.ok(smooth.framingAt(0.25, Frame.of(0)).zoom < 1.1);
  assert.ok(Math.abs(smooth.framingAt(0.5, Frame.of(0)).zoom - 1.2) < 1e-9);
});
test('follow travels to the `to` target', () => {
  const m = CameraMove.of({ type: 'follow', to: { x: 0.1, y: -0.1, zoom: 1.4 } });
  const middle = m.framingAt(0.5, Frame.of(0));
  const end = m.framingAt(1, Frame.of(0));
  assert.ok(middle.x > 0 && middle.x < end.x);
  assert.ok(Math.abs(end.x - 0.1) < 1e-9 && Math.abs(end.y + 0.1) < 1e-9);
});
test('shake is deterministic per frame, varies between frames and keeps zoom >= 1', () => {
  const m = CameraMove.of({ type: 'shake', intensity: 2 });
  const a = m.framingAt(0.5, Frame.of(10));
  const b = CameraMove.of({ type: 'shake', intensity: 2 }).framingAt(0.5, Frame.of(10));
  assert.deepEqual({ ...a }, { ...b });
  assert.notEqual(a.x, m.framingAt(0.5, Frame.of(11)).x);
  assert.ok(a.zoom >= 1);
});
test('cssTransform describes offset, zoom and rotation', () => {
  const css = CameraMove.of({ type: 'still', from: { x: 0.05, y: 0, zoom: 1.2 } }).framingAt(0, Frame.of(0)).cssTransform();
  assert.equal(css, 'translate(5%, 0%) scale(1.2) rotate(0deg)');
});
