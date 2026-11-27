import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MEDIA_SCHEMAS } from '../../../src/main/ipc/mediaSchemas.ts';
import { MAXIMUM_IMAGE_BYTES } from '../../../src/shared/scenarios.ts';

test('ids that name files are plain names, never paths', () => {
  assert.equal(MEDIA_SCHEMAS['voices.record'].safeParse({ folder: '/p', lineId: '../1', wav: new Uint8Array(4) }).success, false);
  assert.equal(MEDIA_SCHEMAS['cast.remove'].safeParse({ folder: '/p', id: 'a/b' }).success, false);
  assert.equal(MEDIA_SCHEMAS['voices.record'].safeParse({ folder: '/p', lineId: 'l-1', wav: new Uint8Array(4) }).success, true);
});

test('binary payloads must be bytes and within the limit', () => {
  const upload = MEDIA_SCHEMAS['scenarios.upload'];
  assert.equal(upload.safeParse({ folder: '/p', lineId: '1', bytes: 'iVBORw0' }).success, false);
  assert.equal(upload.safeParse({ folder: '/p', lineId: '1', bytes: new Uint8Array(MAXIMUM_IMAGE_BYTES + 1) }).success, false);
  assert.equal(upload.safeParse({ folder: '/p', lineId: '1', bytes: new Uint8Array(8) }).success, true);
});

test('a character: only its shape and sizes here (core checks the rig and the parameters), no unknown field', () => {
  const character = { id: 'ana', name: 'Ana', rig: 'giz', parameters: { skin: 'roxo' }, voice: { id: 'vivian' }, defaultExpression: 'happy' };
  assert.equal(MEDIA_SCHEMAS['cast.save'].safeParse({ folder: '/p', character }).success, true);
  assert.equal(MEDIA_SCHEMAS['cast.save'].safeParse({ folder: '/p', character: { ...character, script: 'x' } }).success, false);
  assert.equal(MEDIA_SCHEMAS['cast.voice'].safeParse({ folder: '/p', voice: { provider: 'azure' } }).success, false);
});
