import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChalkStroke } from '../../../src/domain/drawing/ChalkStroke.ts';
import { Silhouette } from '../../../src/domain/drawing/Silhouette.ts';

const CIRCLE = Silhouette.ellipse({ x: 0, y: 0 }, 100, 100);
const offsets = (stroke: ChalkStroke, count: number) => Array.from({ length: count }, (_empty, index) => stroke.offset(index));

test('the same seed always gives the same stroke; another seed gives another one', () => {
  assert.equal(ChalkStroke.for('head', 3).trace(CIRCLE, 10).path(), ChalkStroke.for('head', 3).trace(CIRCLE, 10).path());
  assert.notEqual(ChalkStroke.for('head', 3).trace(CIRCLE, 10).path(), ChalkStroke.for('torso', 3).trace(CIRCLE, 10).path());
});

test('the offsets stay within the amplitude and really wobble (not a constant)', () => {
  const values = offsets(ChalkStroke.for('limb', 4), 200);
  assert.ok(values.every((value) => Math.abs(value) <= 4));
  assert.ok(Math.max(...values) - Math.min(...values) > 3, 'it wobbles');
});

test('the wobble is slow: neighbouring points move little (a hand line, not jitter)', () => {
  const values = offsets(ChalkStroke.for('limb', 4), 200);
  const steps = values.slice(1).map((value, index) => Math.abs(value - values[index]!));
  assert.ok(Math.max(...steps) < 4 * 0.75, `largest step ${Math.max(...steps)}`);
});

test('the traced outline stays near the shape: every point within the amplitude (plus smoothing) of the circle', () => {
  const points = ChalkStroke.for('head', 3).trace(CIRCLE, 10).points(2);
  for (const { x, y } of points) assert.ok(Math.abs(Math.hypot(x, y) - 100) < 3 + 1.5, `${Math.hypot(x, y)}`);
});

test('a closed shape is not closed exactly: the chalk runs a little past its start', () => {
  const traced = ChalkStroke.for('head', 3).trace(CIRCLE, 10);
  assert.equal(traced.closed(), false);
  const points = traced.points(10);
  const [first, last] = [points[0]!, points.at(-1)!];
  const angle = (point: { x: number; y: number }) => Math.atan2(point.y, point.x);
  assert.ok(angle(last) > angle(first) + 0.05, 'the end goes past the start');
});

test('an amplitude of zero follows the shape exactly', () => {
  const points = ChalkStroke.for('head', 0).trace(CIRCLE, 10).points(5);
  for (const { x, y } of points) assert.ok(Math.abs(Math.hypot(x, y) - 100) < 0.6);
});
