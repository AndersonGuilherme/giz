import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadModel, modelReady } from '../../../../src/infrastructure/voice/qwen/modelDownload.ts';

const TREE = [
  { type: 'file', path: 'config.json', size: 4 },
  { type: 'file', path: 'onnx/talker.onnx', size: 6 },
  { type: 'file', path: '.gitattributes', size: 9 },
  { type: 'directory', path: 'onnx', size: 0 },
];

function fakeHub() {
  const urls: string[] = [];
  const fetch = (async (url: string | URL | Request) => {
    urls.push(String(url));
    if (String(url).includes('/api/models/')) return Response.json(TREE);
    return new Response(String(url).endsWith('config.json') ? '1234' : 'abcdef', { status: 200 });
  }) as typeof globalThis.fetch;
  return { urls, fetch };
}

test('downloadModel reports the bytes of the whole model, writes the done marker, and modelReady sees it', async () => {
  const modelsDir = mkdtempSync(join(tmpdir(), 'giz-models-'));
  const { urls, fetch } = fakeHub();
  const seen: Array<[number, number]> = [];
  assert.equal(modelReady('owner/model', modelsDir), false);
  const folder = await downloadModel('owner/model', modelsDir, { fetch, log: () => undefined, onProgress: (received, total) => seen.push([received, total]) });
  assert.equal(folder, join(modelsDir, 'owner__model'));
  assert.equal(readFileSync(join(folder, 'onnx', 'talker.onnx'), 'utf8'), 'abcdef');
  assert.equal(existsSync(join(folder, '.gitattributes')), false);
  assert.deepEqual(seen.at(-1), [10, 10]);
  assert.ok(seen.every(([, total]) => total === 10));
  assert.equal(modelReady('owner/model', modelsDir), true);
  assert.equal(urls.length, 3);
  const again = fakeHub();
  await downloadModel('owner/model', modelsDir, { fetch: again.fetch, log: () => undefined });
  assert.equal(again.urls.length, 0);
});
