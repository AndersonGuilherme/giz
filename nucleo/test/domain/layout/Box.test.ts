import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box } from '../../../src/domain/layout/Box.ts';
import { Boxes } from '../../../src/domain/layout/Boxes.ts';
import { Font } from '../../../src/domain/layout/Font.ts';

const box = (label: string, [x, y, width = 100, height = 100]: number[]) => Box.of(label, { x, y, width, height });

test('boxes that only touch do not overlap', () => {
  assert.equal(box('a', [0, 0]).overlaps(box('b', [100, 0])), false);
  assert.equal(box('a', [0, 0]).overlaps(box('b', [99, 99])), true);
});
test('isInside accepts the edge and rejects what goes past it', () => {
  const area = box('área', [0, 0, 200, 200]);
  assert.equal(box('a', [100, 100]).isInside(area), true);
  assert.equal(box('a', [101, 100]).isInside(area), false);
});
test('two overlapping boxes are reported with their labels', () => {
  const boxes = Boxes.of([box('título', [0, 0]), box('legenda', [50, 50]), box('rodapé', [0, 500])]);
  const labels = boxes.overlappingPairs().map(([a, b]) => [a.label, b.label]);
  assert.deepEqual(labels, [['título', 'legenda']]);
});
test('outsideOf lists the boxes that leave the area', () => {
  const boxes = Boxes.of([box('dentro', [10, 10]), box('fora', [150, 10])]);
  assert.deepEqual(boxes.outsideOf(box('área', [0, 0, 200, 200])).map((c) => c.label), ['fora']);
});
test('overflowingTexts reports the box whose text does not fit', () => {
  const font = Font.of({ family: 'text', size: 50, lineHeight: 1.2, maximumLines: 1 });
  const short = Box.withText('curta', { x: 0, y: 0, width: 400, height: 60 }, { text: 'oi', font });
  const long = Box.withText('longa', { x: 0, y: 100, width: 400, height: 60 }, { text: 'palavra '.repeat(20), font });
  assert.deepEqual(Boxes.of([short, long]).overflowingTexts().map((c) => c.label), ['longa']);
});
test('plus joins two lists of boxes, so overlaps across them are seen', () => {
  const joined = Boxes.of([box('hud', [0, 0])]).plus(Boxes.of([box('destaque', [50, 50])]));
  assert.deepEqual(joined.overlappingPairs().map(([a, b]) => [a.label, b.label]), [['hud', 'destaque']]);
});

test('a box of a text fitted elsewhere keeps only whether it fitted', () => {
  const rectangle = { x: 0, y: 0, width: 10, height: 10 };
  assert.equal(Box.fitted('eixo', rectangle, { fits: true }).textFits(), true);
  assert.equal(Box.fitted('eixo', rectangle, { fits: false }).textFits(), false);
});
