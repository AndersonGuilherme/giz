import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GalleryGrid } from '../../../src/domain/layout/GalleryGrid.ts';

const AREA = { width: 1000, height: 600 };

test('up to five cards share one row; more cards go to more rows, at most five per row', () => {
  assert.deepEqual([3, 5, 6, 8, 10, 11].map((count) => { const { columns, rows } = GalleryGrid.for(count, AREA, 10); return [columns, rows]; }), [
    [3, 1], [5, 1], [3, 2], [4, 2], [5, 2], [4, 3],
  ]);
});

test('the cards fill the area with the gaps between them', () => {
  const { columns, rows, card } = GalleryGrid.for(8, AREA, 10);
  assert.equal(card.width * columns + 10 * (columns - 1), AREA.width);
  assert.equal(card.height * rows + 10 * (rows - 1), AREA.height);
});

test('an empty gallery is an error, not a division by zero', () => {
  assert.throws(() => GalleryGrid.for(0, AREA, 10), /galeria vazia/);
});

test('a thumbnail keeps the frame proportion and fits the card: as large as the narrower side allows', () => {
  assert.deepEqual(GalleryGrid.contain({ width: 1920, height: 1080 }, { width: 358, height: 199 }), { scale: 199 / 1080, width: (1920 * 199) / 1080, height: 199 });
  assert.deepEqual(GalleryGrid.contain({ width: 1080, height: 1920 }, { width: 190, height: 409 }), { scale: 190 / 1080, width: 190, height: (1920 * 190) / 1080 });
});
