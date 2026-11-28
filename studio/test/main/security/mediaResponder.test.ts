import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mediaResponder } from '../../../src/main/security/mediaResponder.ts';
import { mediaUrlOf } from '../../../src/main/services/media/mediaUrls.ts';

function responder(allowed: (path: string) => boolean) {
  const fetched: Array<{ url: string; range: string | null }> = [];
  const fetch = async (url: string, init: { headers: Headers }) => {
    fetched.push({ url, range: init.headers.get('range') });
    return new Response(new Uint8Array([1, 2, 3]), { status: 206, headers: { 'content-type': 'text/html', 'content-range': 'bytes 0-2/9' } });
  };
  return { fetched, answer: mediaResponder({ allowed, fetch }) };
}

test('a file outside every granted folder is a 404, and the disk is never read', async () => {
  const { fetched, answer } = responder(() => false);
  const response = await answer(new Request(mediaUrlOf('/home/ana/other/1.png', 1)));
  assert.equal(response.status, 404);
  assert.deepEqual(fetched, []);
});

test('a granted file is served with its type forced by the extension, no-store, and the Range passed through', async () => {
  const asked: string[] = [];
  const { fetched, answer } = responder((path) => (asked.push(path), true));
  const response = await answer(new Request(mediaUrlOf('/projects/cats/voice/1.wav', 5), { headers: { range: 'bytes=0-2' } }));
  assert.deepEqual(asked, ['/projects/cats/voice/1.wav']);
  assert.deepEqual(fetched, [{ url: 'file:///projects/cats/voice/1.wav', range: 'bytes=0-2' }]);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-type'), 'audio/wav', 'never the type the file system guessed');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3]);
});

test('%2e%2e in the URL never climbs out: not served, not even asked about', async () => {
  const asked: string[] = [];
  const { fetched, answer } = responder((path) => (asked.push(path), true));
  for (const url of [
    'gizzy-media://file/%2Fprojects%2Fcats%2F%2e%2e%2F%2e%2e%2Fhome%2Fana%2F.ssh%2Fid.png',
    'gizzy-media://file/%2Fprojects%2Fcats%2F..%2F..%2Fetc%2Fx.png',
    'gizzy-media://file/%2Fprojects/%2e%2e/%2e%2e/etc/x.png',
    'gizzy-media://file/%2Fprojects%2Fcats%2Fkeys.json',
  ]) {
    assert.equal((await answer(new Request(url))).status, 404, url);
  }
  assert.deepEqual([asked, fetched], [[], []]);
});

test('a file the disk cannot give is a 404', async () => {
  const answer = mediaResponder({ allowed: () => true, fetch: async () => new Response(null, { status: 404 }) });
  assert.equal((await answer(new Request(mediaUrlOf('/projects/cats/voice/9.wav', 1)))).status, 404);
  const broken = mediaResponder({ allowed: () => true, fetch: async () => { throw new Error('EACCES'); } });
  assert.equal((await broken(new Request(mediaUrlOf('/projects/cats/voice/9.wav', 1)))).status, 404);
});

test("a bundled font is served as font/ttf and readable by the page (the scheme answers CORS for it)", async () => {
  const { answer } = responder(() => true);
  const response = await answer(new Request(mediaUrlOf('/core/public/fonts/Nunito.ttf', 5)));
  assert.equal(response.headers.get('content-type'), 'font/ttf');
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
});

test('only a font says any origin may read it: pictures, audio and videos stay without CORS', async () => {
  const { answer } = responder(() => true);
  for (const file of ['/p/voice/1.wav', '/p/scenes/1.png', '/p/output/video.mp4']) {
    const response = await answer(new Request(mediaUrlOf(file, 5)));
    assert.equal(response.headers.get('access-control-allow-origin'), null, file);
  }
});
