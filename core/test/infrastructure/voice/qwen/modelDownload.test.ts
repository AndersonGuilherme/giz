import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadModel, modelReady, openDownloadedModel } from '../../../../src/infrastructure/voice/qwen/modelDownload.ts';
import { QWEN_MODELS, revisionOf } from '../../../../src/infrastructure/voice/qwen/qwenModels.ts';

const REVISION = '0123456789abcdef0123456789abcdef01234567';
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const gitOid = (text: string) => createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0${text}`).digest('hex');
const CONTENTS: Record<string, string> = { 'config.json': '1234', 'onnx/talker.onnx': 'abcdef' };

// config.json is a small git file (checked by its git oid); talker.onnx is an LFS file (checked by its sha256).
const tree = (overrides: Record<string, unknown>[] = []) => [
  { type: 'file', path: 'config.json', size: 4, oid: gitOid('1234') },
  { type: 'file', path: 'onnx/talker.onnx', size: 6, oid: gitOid('pointer'), lfs: { oid: sha256('abcdef'), size: 6 } },
  { type: 'file', path: '.gitattributes', size: 9, oid: gitOid('x') },
  { type: 'directory', path: 'onnx', size: 0, oid: gitOid('d') },
  ...overrides,
];

function fakeHub(entries: unknown[] = tree(), served: Record<string, string> = CONTENTS) {
  const urls: string[] = [];
  const fetch = (async (url: string | URL | Request) => {
    urls.push(String(url));
    if (String(url).includes('/api/models/')) return Response.json(entries);
    const file = String(url).split(`/resolve/${REVISION}/`)[1] ?? '';
    return new Response(served[file] ?? 'missing', { status: 200 });
  }) as typeof globalThis.fetch;
  return { urls, fetch };
}

const options = (fetch: typeof globalThis.fetch, more = {}) => ({ fetch, log: () => undefined, revision: REVISION, ...more });
const freshModels = () => mkdtempSync(join(tmpdir(), 'giz-models-'));

test('downloadModel reads the tree and the files of one pinned commit, reports the bytes and writes the done marker', async () => {
  const modelsDir = freshModels();
  const { urls, fetch } = fakeHub();
  const seen: Array<[number, number]> = [];
  assert.equal(modelReady('owner/model', modelsDir), false);
  const folder = await downloadModel('owner/model', modelsDir, options(fetch, { onProgress: (received: number, total: number) => seen.push([received, total]) }));
  assert.equal(folder, join(modelsDir, 'owner__model'));
  assert.equal(readFileSync(join(folder, 'onnx', 'talker.onnx'), 'utf8'), 'abcdef');
  assert.equal(existsSync(join(folder, '.gitattributes')), false);
  assert.deepEqual(seen.at(-1), [10, 10]);
  assert.ok(seen.every(([, total]) => total === 10));
  assert.equal(modelReady('owner/model', modelsDir), true);
  assert.deepEqual(urls, [
    `https://huggingface.co/api/models/owner/model/tree/${REVISION}?recursive=true`,
    `https://huggingface.co/owner/model/resolve/${REVISION}/config.json`,
    `https://huggingface.co/owner/model/resolve/${REVISION}/onnx/talker.onnx`,
  ]);
  const again = fakeHub();
  await downloadModel('owner/model', modelsDir, options(again.fetch));
  assert.equal(again.urls.length, 0);
});

test('an LFS file whose bytes do not match its lfs.oid is deleted and the model is not marked ready', async () => {
  const modelsDir = freshModels();
  const { fetch } = fakeHub(tree(), { ...CONTENTS, 'onnx/talker.onnx': 'evil!!' });
  await assert.rejects(downloadModel('owner/model', modelsDir, options(fetch)), /onnx\/talker\.onnx baixado não confere/);
  assert.equal(existsSync(join(modelsDir, 'owner__model', 'onnx', 'talker.onnx')), false);
  assert.equal(modelReady('owner/model', modelsDir), false);
});

test('a small git file whose bytes do not match its git oid is refused too', async () => {
  const modelsDir = freshModels();
  const { fetch } = fakeHub(tree(), { ...CONTENTS, 'config.json': '9999' });
  await assert.rejects(downloadModel('owner/model', modelsDir, options(fetch)), /config\.json baixado não confere/);
  assert.equal(existsSync(join(modelsDir, 'owner__model', 'config.json')), false);
});

test('a tree path that is not plain (.., absolute, backslash) is refused before any file is downloaded', async () => {
  for (const path of ['../../outside.onnx', '/etc/evil', 'onnx\\evil.onnx', 'onnx/../../x']) {
    const modelsDir = freshModels();
    const { urls, fetch } = fakeHub(tree([{ type: 'file', path, size: 1, oid: gitOid('x') }]));
    await assert.rejects(downloadModel('owner/model', modelsDir, options(fetch)), /caminho inválido/, path);
    assert.equal(urls.length, 1, 'only the tree was asked');
    assert.deepEqual(readdirSync(modelsDir), []);
  }
});

test('a tree entry without a hash is refused', async () => {
  const { fetch } = fakeHub(tree([{ type: 'file', path: 'extra.bin', size: 1 }]));
  await assert.rejects(downloadModel('owner/model', freshModels(), options(fetch)), /hash/);
});

test('each known model is pinned to a commit; another repository follows QWEN_TTS_REVISION or main', () => {
  for (const { repo } of Object.values(QWEN_MODELS)) assert.match(revisionOf(repo, {}), /^[0-9a-f]{40}$/);
  assert.equal(revisionOf('someone/other', {}), 'main');
  assert.equal(revisionOf('someone/other', { QWEN_TTS_REVISION: 'abc' }), 'abc');
});

test('openDownloadedModel never downloads: a model not downloaded yet gives a readable error', async () => {
  const modelsDir = freshModels();
  assert.throws(() => openDownloadedModel('owner/model', modelsDir), /modelo de voz .* não foi baixado/);
  const { fetch } = fakeHub();
  await downloadModel('owner/model', modelsDir, options(fetch));
  assert.equal(openDownloadedModel('owner/model', modelsDir), join(modelsDir, 'owner__model'));
});
