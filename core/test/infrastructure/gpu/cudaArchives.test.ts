import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cudaArchivesOf, downloadArchive } from '../../../src/infrastructure/gpu/cudaArchives.ts';

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const entry = (path: string, text = 'x') => ({ 'linux-x86_64': { relative_path: path, sha256: sha256(text), size: String(text.length) } });
const CUDA = {
  cuda_cudart: entry('cuda_cudart/linux-x86_64/cudart.tar.xz', 'cudart'),
  libcublas: entry('libcublas/linux-x86_64/cublas.tar.xz', 'cublas'),
  libcurand: entry('libcurand/linux-x86_64/curand.tar.xz', 'curand'),
};
const CUDNN = { cudnn: { 'linux-x86_64': { cuda13: entry('cudnn/linux-x86_64/cudnn13.tar.xz', 'cudnn')['linux-x86_64'] } } };

function fakeNvidia(cuda: unknown = CUDA, cudnn: unknown = CUDNN) {
  return (async (url: string | URL | Request) => {
    const address = String(url);
    if (address.endsWith('/cuda/redist/')) return new Response('redistrib_13.0.2.json');
    return Response.json(address.includes('/cudnn/') ? cudnn : cuda);
  }) as typeof fetch;
}

test('each archive carries the sha256 and size of its manifest entry', async () => {
  const archives = await cudaArchivesOf(13, fakeNvidia());
  assert.deepEqual(archives.map(({ name }) => name), ['cuda_cudart', 'libcublas', 'libcurand', 'cudnn']);
  assert.deepEqual(archives[0], {
    name: 'cuda_cudart',
    url: 'https://developer.download.nvidia.com/compute/cuda/redist/cuda_cudart/linux-x86_64/cudart.tar.xz',
    sha256: sha256('cudart'),
    bytes: 6,
  });
  assert.equal(archives[3]!.url, 'https://developer.download.nvidia.com/compute/cudnn/redist/cudnn/linux-x86_64/cudnn13.tar.xz');
});

test('a manifest entry without a path, hash or size, or with a path out of the folder, is refused before any download', async () => {
  const without = { ...CUDA, libcurand: { 'linux-x86_64': { sha256: sha256('a'), size: '1' } } };
  await assert.rejects(cudaArchivesOf(13, fakeNvidia(without)), /libcurand/);
  const noHash = { ...CUDA, libcublas: { 'linux-x86_64': { relative_path: 'libcublas/x.tar.xz', size: '1' } } };
  await assert.rejects(cudaArchivesOf(13, fakeNvidia(noHash)), /libcublas/);
  const missing = { cuda_cudart: CUDA.cuda_cudart };
  await assert.rejects(cudaArchivesOf(13, fakeNvidia(missing)), /libcublas/);
  const escaping = { ...CUDA, cuda_cudart: entry('../../../evil.tar.xz', 'cudart') };
  await assert.rejects(cudaArchivesOf(13, fakeNvidia(escaping)), /caminho inválido/);
  const absolute = { cudnn: { 'linux-x86_64': { cuda13: entry('/etc/cudnn.tar.xz')['linux-x86_64'] } } };
  await assert.rejects(cudaArchivesOf(13, fakeNvidia(CUDA, absolute)), /caminho inválido/);
});

const report = { log: () => undefined, onProgress: () => undefined };

test('an archive is downloaded with its expected size and kept when its sha256 matches', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'giz-cuda-archive-'));
  const archive = { name: 'cuda_cudart', url: 'https://x/cudart.tar.xz', sha256: sha256('cudart'), bytes: 6 };
  const send = (async () => new Response('cudart')) as typeof fetch;
  const file = await downloadArchive(archive, folder, { ...report, fetch: send });
  assert.equal(file, join(folder, 'archives', 'cudart.tar.xz'));
  assert.equal(existsSync(file), true);
});

test('an archive whose bytes do not match the manifest hash is deleted and nothing is extracted', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'giz-cuda-archive-'));
  const archive = { name: 'cuda_cudart', url: 'https://x/cudart.tar.xz', sha256: sha256('cudart'), bytes: 6 };
  const send = (async () => new Response('evil!!')) as typeof fetch;
  await assert.rejects(downloadArchive(archive, folder, { ...report, fetch: send }), /cuda_cudart baixado não confere/);
  assert.deepEqual(readdirSync(join(folder, 'archives')), []);
});

test('an archive of another size than the manifest says is not accepted', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'giz-cuda-archive-'));
  const archive = { name: 'libcurand', url: 'https://x/curand.tar.xz', sha256: sha256('curand'), bytes: 6 };
  const send = (async () => new Response('curand and more')) as typeof fetch;
  await assert.rejects(downloadArchive(archive, folder, { ...report, fetch: send }), /incompleto|não confere/);
  assert.equal(existsSync(join(folder, 'archives', 'curand.tar.xz')), false);
});
