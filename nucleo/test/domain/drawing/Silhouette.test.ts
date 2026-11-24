import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Silhouette } from '../../../src/domain/drawing/Silhouette.ts';
import type { Point } from '../../../src/domain/drawing/Silhouette.ts';

const distance = (from: Point, to: Point) => Math.hypot(to.x - from.x, to.y - from.y);
const near = (actual: number, expected: number, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('an ellipse is sampled on its curve, about `spacing` apart, and closes on its start', () => {
  const points = Silhouette.ellipse({ x: 10, y: 20 }, 50, 30).points(8);
  for (const point of points) near(((point.x - 10) / 50) ** 2 + ((point.y - 20) / 30) ** 2, 1, 0.02);
  const gaps = points.slice(1).map((point, index) => distance(points[index]!, point));
  assert.ok(gaps.every((gap) => gap > 3 && gap < 12), `gaps ${Math.min(...gaps)}..${Math.max(...gaps)}`);
  assert.deepEqual(points.at(-1), points[0]);
  assert.equal(Silhouette.ellipse({ x: 0, y: 0 }, 50, 30).closed(), true);
});

test('a rounded rectangle stays inside its box and touches every side', () => {
  const points = Silhouette.roundedRect({ x: -20, y: 0, width: 40, height: 100 }, 12).points(4);
  assert.ok(points.every(({ x, y }) => x >= -20 - 1e-9 && x <= 20 + 1e-9 && y >= -1e-9 && y <= 100 + 1e-9));
  near(Math.min(...points.map(({ x }) => x)), -20);
  near(Math.max(...points.map(({ y }) => y)), 100);
  assert.ok(!points.some(({ x, y }) => x < -19 && y < 1), 'the corners are rounded');
});

test('parse reads absolute M, L, H, V, C, Q and Z; points run along the lines', () => {
  const square = Silhouette.parse('M0,0 L10,0 V10 H0 Z');
  assert.equal(square.closed(), true);
  const points = square.points(5);
  assert.ok(points.some(({ x, y }) => x === 5 && y === 0));
  assert.deepEqual(points[0], { x: 0, y: 0 });
  const curve = Silhouette.parse('M 0 0 C 0 -10 20 -10 20 0 Q 10 20 0 0');
  assert.equal(curve.closed(), false);
  assert.ok(curve.points(2).some(({ y }) => y < -7), 'the cubic bulges up');
  assert.ok(curve.points(2).some(({ y }) => y > 9), 'the quadratic bulges down');
});

test('parse refuses what it cannot follow (relative commands, arcs)', () => {
  assert.throws(() => Silhouette.parse('M0,0 l10,0'), /caminho/);
  assert.throws(() => Silhouette.parse('M0,0 A5,5 0 0,1 10,0'), /caminho/);
});

test('through draws a smooth curve that passes by every point', () => {
  const given = [{ x: 0, y: 0 }, { x: 10, y: 5 }, { x: 20, y: 0 }, { x: 30, y: 5 }];
  const curve = Silhouette.through(given, false);
  const sampled = curve.points(0.5);
  for (const point of given) assert.ok(sampled.some((sample) => distance(sample, point) < 0.6), `${point.x},${point.y}`);
  assert.equal(curve.path().startsWith('M0,0 C'), true);
});

test('path writes the segments as SVG path data', () => {
  assert.equal(Silhouette.parse('M0,0 L10,0 L10,10 Z').path(), 'M0,0 L10,0 L10,10 L0,0 Z');
  assert.equal(Silhouette.parse('M0,0 C1,2 3,4 5,6').path(), 'M0,0 C1,2 3,4 5,6');
});

test('scaled moves and resizes the shape around the origin', () => {
  const moved = Silhouette.ellipse({ x: 0, y: 0 }, 10, 10).scaled(2, { x: 100, y: 50 });
  for (const point of moved.points(4)) near(distance(point, { x: 100, y: 50 }), 20, 0.3);
});
