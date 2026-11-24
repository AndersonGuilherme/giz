import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Rectangle, Square, stretch } from './rectangle.ts';
import { FixedRectangle, FixedSquare, areas } from './fixed-rectangle.ts';

test('retângulo: esticar para 5 × 4 dá área 20', () => {
  assert.equal(stretch(new Rectangle()), 20);
});

test('quadrado: o mesmo código dá 16 (o bug, documentado)', () => {
  assert.equal(stretch(new Square()), 16);
});

test('retângulo imutável: o quadrado é um subtipo sem surpresa', () => {
  assert.deepEqual(areas([new FixedRectangle(5, 4), new FixedSquare(4)]), [20, 16]);
});
