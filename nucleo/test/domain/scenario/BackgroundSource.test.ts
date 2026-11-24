import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BackgroundSource, VECTOR_BACKGROUNDS } from '../../../src/domain/scenario/BackgroundSource.ts';

test('the vector backgrounds have English names', () => {
  assert.deepEqual([...VECTOR_BACKGROUNDS], [
    'room', 'street', 'field', 'night-sky', 'lab', 'village',
    'cave', 'ancient-egypt', 'ancient-rome', 'medieval-castle', 'pirate-ship', 'victorian-street', 'fifties-diner',
    'classroom', 'office', 'city-night', 'space-station', 'cyber-city', 'graveyard', 'haunted-house',
  ]);
});

test('an image that loads is drawn as an image', () => {
  assert.deepEqual(BackgroundSource.for({ image: 'scenes/1.png' }, { imageFailed: false }), { kind: 'image', image: 'scenes/1.png' });
});

test('a missing image falls back to the room vector background', () => {
  assert.deepEqual(BackgroundSource.for({ image: 'scenes/1.png', colors: { wall: '#000000' } }, { imageFailed: true }), {
    kind: 'vector',
    vector: 'room',
    colors: { wall: '#000000' },
  });
});

test('a vector background keeps its name and colors; an unknown name or none at all becomes the room', () => {
  assert.deepEqual(BackgroundSource.for({ vector: 'village' }, { imageFailed: false }), { kind: 'vector', vector: 'village', colors: {} });
  assert.equal(BackgroundSource.for({ vector: 'castelo' }, { imageFailed: false }).vector, 'room');
  assert.equal(BackgroundSource.for({}, { imageFailed: false }).vector, 'room');
});

test('with an image and a vector, a failing image falls back to the given vector', () => {
  assert.equal(BackgroundSource.for({ image: 'x.png', vector: 'lab' }, { imageFailed: true }).vector, 'lab');
});
