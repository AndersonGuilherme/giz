import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ImageProvider } from 'gizzycera-core/src/application/ports/ImageProvider.ts';
import { RehearsalPainter } from '../../../../../src/main/adapters/media/rehearsal/RehearsalPainter.ts';
import { voiceKeys } from '../../../../../src/main/adapters/media/coreJobs.ts';

const REAL = { estimate: () => ({}) as never, identity: () => ({ provider: 'fal', model: 'flux' }), generate: async () => ({ bytes: new Uint8Array(), mime: 'image/png' }) } as ImageProvider;

test('the rehearsal painter stops at once on a cancel, like a real call aborted in flight', async () => {
  const controller = new AbortController();
  const started = Date.now();
  const painting = new RehearsalPainter(REAL).generate({ prompt: 'p', size: { width: 64, height: 64 } }, { signal: controller.signal });
  setTimeout(() => controller.abort(), 20);
  await assert.rejects(painting, { name: 'AbortError' });
  assert.ok(Date.now() - started < 500, 'it did not wait for the whole pause');
});

test('one key function for every paid voice: the key, or a readable error naming the service', () => {
  assert.equal(voiceKeys('k')('elevenlabs'), 'k');
  assert.throws(() => voiceKeys(undefined)('fish'), /fish/);
});
