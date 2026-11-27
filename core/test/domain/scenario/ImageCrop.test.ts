import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DomainError } from '../../../src/domain/DomainError.ts';
import { ImageCrop } from '../../../src/domain/scenario/ImageCrop.ts';
import { BackgroundSource } from '../../../src/domain/scenario/BackgroundSource.ts';

test('no crop: the picture covers the image box as it is, centered', () => {
  assert.deepEqual(ImageCrop.none().placement(), { size: 100, left: 0, top: 0, focusX: 50, focusY: 50 });
});

test('a zoomed crop is a larger picture moved so the chosen focus stays in the box (its edge never shows)', () => {
  const placement = ImageCrop.of({ zoom: 2, x: 0.25, y: 1 }).placement();
  assert.deepEqual(placement, { size: 200, left: -25, top: -100, focusX: 25, focusY: 100 });
  // The box (0..100) is always inside the picture (left .. left + size).
  for (const x of [0, 0.3, 1]) {
    const { size, left } = ImageCrop.of({ zoom: 3, x, y: 0.5 }).placement();
    assert.ok(left <= 0 && left + size >= 100);
  }
});

test('the crop is plain data in the script (background.crop) and comes back the same', () => {
  const json = { zoom: 1.5, x: 0.2, y: 0.7 };
  assert.deepEqual(ImageCrop.of(json).toJson(), json);
});

test('a zoom below 1 or above 4, or a focus outside 0..1, is a readable error', () => {
  assert.throws(() => ImageCrop.of({ zoom: 0.5, x: 0.5, y: 0.5 }), DomainError);
  assert.throws(() => ImageCrop.of({ zoom: 5, x: 0.5, y: 0.5 }), /zoom/);
  assert.throws(() => ImageCrop.of({ zoom: 1, x: -0.1, y: 0.5 }), /x/);
  assert.throws(() => ImageCrop.of({ zoom: 1, x: 0.5, y: 1.2 }), /y/);
});

test('an image background carries its crop to the renderer; a vector one has none', () => {
  const crop = { zoom: 2, x: 0, y: 0 };
  assert.deepEqual(BackgroundSource.for({ image: 'scenes/own/1.png', crop }, { imageFailed: false }), { kind: 'image', image: 'scenes/own/1.png', crop });
  assert.equal(BackgroundSource.for({ image: 'scenes/own/1.png', crop }, { imageFailed: true }).kind, 'vector');
});
