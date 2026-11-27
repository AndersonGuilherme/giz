import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadResumable } from '../../../src/infrastructure/download/resumableDownload.ts';

type Call = { url: string; range?: string };

function fakeFetch(respond: (call: Call) => Response) {
  const calls: Call[] = [];
  const fetch = async (url: string | URL | Request, init?: RequestInit) => {
    const range = (init?.headers as Record<string, string> | undefined)?.Range;
    const call = { url: String(url), range };
    calls.push(call);
    return respond(call);
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
}

const folder = () => mkdtempSync(join(tmpdir(), 'giz-download-'));

test('downloads into a .part file and renames it when complete; a nested folder is created', async () => {
  const destination = join(folder(), 'a', 'b', 'model.onnx');
  const { calls, fetch } = fakeFetch(() => new Response('conteudo', { status: 200 }));
  await downloadResumable({ url: 'https://x/model.onnx', destination, label: 'model.onnx', expectedBytes: 8 }, { fetch });
  assert.equal(readFileSync(destination, 'utf8'), 'conteudo');
  assert.equal(existsSync(`${destination}.part`), false);
  assert.deepEqual(calls, [{ url: 'https://x/model.onnx', range: undefined }]);
});

test('a file already there with the expected size is not downloaded again', async () => {
  const destination = join(folder(), 'model.onnx');
  writeFileSync(destination, 'conteudo');
  const { calls, fetch } = fakeFetch(() => new Response('outro', { status: 200 }));
  await downloadResumable({ url: 'https://x/m', destination, label: 'm', expectedBytes: 8 }, { fetch });
  assert.equal(calls.length, 0);
});

test('an interrupted download resumes from the .part with a Range request', async () => {
  const destination = join(folder(), 'model.onnx');
  writeFileSync(`${destination}.part`, 'cont');
  const { calls, fetch } = fakeFetch(() => new Response('eudo', { status: 206 }));
  await downloadResumable({ url: 'https://x/m', destination, label: 'm', expectedBytes: 8 }, { fetch });
  assert.equal(calls[0]?.range, 'bytes=4-');
  assert.equal(readFileSync(destination, 'utf8'), 'conteudo');
});

test('a server that ignores the Range (200) rewrites the .part from the start', async () => {
  const destination = join(folder(), 'model.onnx');
  writeFileSync(`${destination}.part`, 'lixo');
  const { fetch } = fakeFetch(() => new Response('conteudo', { status: 200 }));
  await downloadResumable({ url: 'https://x/m', destination, label: 'm', expectedBytes: 8 }, { fetch });
  assert.equal(readFileSync(destination, 'utf8'), 'conteudo');
});

test('without an expected size, the content-length decides, and onStart receives the total', async () => {
  const destination = join(folder(), 'cudnn.tar.xz');
  const totals: number[] = [];
  const { fetch } = fakeFetch(() => new Response('12345', { status: 200, headers: { 'content-length': '5' } }));
  await downloadResumable({ url: 'https://x/c', destination, label: 'cudnn' }, { fetch, onStart: (total) => totals.push(total) });
  assert.deepEqual(totals, [5]);
  assert.equal(readFileSync(destination, 'utf8'), '12345');
});

test('an HTTP error or a short file fails with a readable message, keeping the .part to resume', async () => {
  const destination = join(folder(), 'model.onnx');
  const failing = fakeFetch(() => new Response('nao', { status: 404 }));
  await assert.rejects(downloadResumable({ url: 'https://x/m', destination, label: 'm' }, { fetch: failing.fetch }), /falha ao baixar m: HTTP 404/);
  const short = fakeFetch(() => new Response('cont', { status: 200 }));
  await assert.rejects(downloadResumable({ url: 'https://x/m', destination, label: 'm', expectedBytes: 8 }, { fetch: short.fetch }), /download incompleto de m/);
  assert.equal(readFileSync(`${destination}.part`, 'utf8'), 'cont');
});

test('onBytes follows the bytes on disk, counting the ones a resumed download already had', async () => {
  const destination = join(folder(), 'model.onnx');
  writeFileSync(`${destination}.part`, 'cont');
  const seen: number[] = [];
  const { fetch } = fakeFetch(() => new Response('eudo', { status: 206 }));
  await downloadResumable({ url: 'https://x/m', destination, label: 'm', expectedBytes: 8 }, { fetch, onBytes: (received) => seen.push(received) });
  assert.equal(seen[0], 4);
  assert.equal(seen.at(-1), 8);
  assert.ok(seen.every((value, index) => index === 0 || value >= (seen[index - 1] ?? 0)));
});
