import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mediaPathOf, mediaUrlOf } from '../../../../src/main/services/media/mediaUrls.ts';

test('a media URL names one absolute file and its version; it reads back to the same path', () => {
  const url = mediaUrlOf('/home/ana/giz/cats/scenes/1 own.png', 1234.6);
  assert.equal(url, 'giz-media://file/%2Fhome%2Fana%2Fgiz%2Fcats%2Fscenes%2F1%20own.png?v=1235');
  assert.equal(mediaPathOf(url), '/home/ana/giz/cats/scenes/1 own.png');
});

test('only pictures and WAV audio, at a plain absolute path: anything else names no file', () => {
  for (const path of ['/etc/passwd', '/home/ana/keys.json', 'relative/1.png', '/home/ana/../etc/x.png', '/a/b.png\0.txt']) {
    assert.equal(mediaPathOf(mediaUrlOf(path, 1)), undefined, path);
  }
  assert.equal(mediaPathOf('file:///home/ana/1.png'), undefined);
  assert.equal(mediaPathOf('giz-media://file/%E0%A4%A'), undefined);
  assert.equal(mediaPathOf(mediaUrlOf('/home/ana/voice/1.WAV', 1)), '/home/ana/voice/1.WAV');
});
