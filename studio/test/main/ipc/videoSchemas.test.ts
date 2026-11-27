import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VIDEO_SCHEMAS } from '../../../src/main/ipc/videoSchemas.ts';

test('the Video channels take a folder and an aspect, never a file path nor another field', () => {
  assert.equal(VIDEO_SCHEMAS['video.preview'].safeParse({ folder: '/p' }).success, true);
  assert.equal(VIDEO_SCHEMAS['video.preview'].safeParse({ folder: '/p', aspect: '4:3' }).success, false);
  assert.equal(VIDEO_SCHEMAS['video.copyCaptions'].safeParse({ folder: '/p', aspect: '9:16' }).success, true);
  assert.equal(VIDEO_SCHEMAS['video.copyCaptions'].safeParse({ folder: '/p', aspect: '9:16', file: '/etc/passwd' }).success, false);
  assert.equal(VIDEO_SCHEMAS['video.exportCaptions'].safeParse({ folder: '', aspect: '9:16' }).success, false);
  assert.equal(VIDEO_SCHEMAS['video.render'].safeParse({ folder: '/p', aspect: '16:9' }).success, true);
  assert.equal(VIDEO_SCHEMAS['video.status'].safeParse({}).success, true);
  assert.equal(VIDEO_SCHEMAS['video.cancel'].safeParse({ folder: '/p' }).success, true);
  assert.equal(VIDEO_SCHEMAS['video.cancel'].safeParse({}).success, false, 'a cancel names the folder it stops');
});
