import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installOrtCuda, ortCudaPackageOf, ORT_CUDA_PACKAGES } from '../../../src/infrastructure/gpu/ortCudaInstall.ts';
import type { Download, DownloadOptions } from '../../../src/infrastructure/download/resumableDownload.ts';

// adm-zip comes with onnxruntime-node; the tests use it only to write a package like NuGet's (stored and deflated).
const ortRequire = createRequire(createRequire(import.meta.url).resolve('onnxruntime-node/package.json'));
type Zip = { addFile(name: string, data: Buffer): void; writeZip(path: string): void; getEntries(): Array<{ header: { method: number } }> };
const AdmZip = ortRequire('adm-zip') as new () => Zip;
const NATIVE = 'runtimes/linux-x64/native';
const PROVIDER = Buffer.alloc(300_000, 'cuda provider libcudart.so.12 ');

function fakePackage(path: string, files: Readonly<Record<string, Buffer>>): void {
  const zip = new AdmZip();
  for (const [name, data] of Object.entries(files)) zip.addFile(name, data);
  zip.writeZip(path);
}

const realPackage = (path: string) => fakePackage(path, {
  [`${NATIVE}/libonnxruntime_providers_cuda.so`]: PROVIDER,
  [`${NATIVE}/libonnxruntime_providers_shared.so`]: Buffer.from('shared'),
  [`${NATIVE}/libonnxruntime_providers_tensorrt.so`]: Buffer.from('tensorrt'),
});

function folders() {
  const root = mkdtempSync(join(tmpdir(), 'gizzy-ort-cuda-'));
  const binFolder = join(root, 'bin');
  mkdirSync(binFolder);
  return { modelsDir: join(root, 'models'), binFolder, version: '9.9.9' };
}

const sha512Of = (path: string) => createHash('sha512').update(readFileSync(path)).digest('base64');

// A download that writes `make`'s package and a table that knows it (or a wrong hash for it).
function fakeNuget(make: (path: string) => void, wrongHash = false) {
  const asked: Array<{ download: Download; options: DownloadOptions }> = [];
  const sample = join(mkdtempSync(join(tmpdir(), 'gizzy-nupkg-')), 'p.nupkg');
  make(sample);
  const known = { sha512: wrongHash ? createHash('sha512').update('other').digest('base64') : sha512Of(sample), bytes: statSync(sample).size };
  const download = async (wanted: Download, options: DownloadOptions = {}) => {
    asked.push({ download: wanted, options });
    options.onStart?.(known.bytes);
    options.onBytes?.(known.bytes);
    make(wanted.destination);
  };
  return { asked, tools: { download, packages: { '9.9.9': known } } };
}

const quiet = { log: () => undefined, onProgress: () => undefined };

test('the provider package of the pinned ONNX Runtime is the NuGet one, with its NuGet sha512 and size', () => {
  const known = ortCudaPackageOf('1.31.1');
  assert.equal(known.url, 'https://api.nuget.org/v3-flatcontainer/microsoft.ml.onnxruntime.gpu.linux/1.31.1/microsoft.ml.onnxruntime.gpu.linux.1.31.1.nupkg');
  assert.deepEqual([known.sha512.length, known.bytes], [88, 244_926_281]);
  assert.ok(ORT_CUDA_PACKAGES['1.31.1']);
});

test('an ONNX Runtime version without a known package fails readably, before anything is downloaded', async () => {
  assert.throws(() => ortCudaPackageOf('0.0.1'), /ONNX Runtime 0\.0\.1.*ortCudaInstall\.ts/);
  const target = folders();
  let downloaded = false;
  await assert.rejects(installOrtCuda(target, quiet, { download: async () => { downloaded = true; }, packages: {} }), /ONNX Runtime 9\.9\.9/);
  assert.equal(downloaded, false);
});

test('the provider is downloaded (resumable, its size expected), checked, streamed out next to ONNX Runtime and the package removed', async () => {
  const target = folders();
  const nuget = fakeNuget(realPackage);
  const progress: number[] = [];
  await installOrtCuda(target, { log: () => undefined, onProgress: (step) => progress.push(step.receivedBytes) }, nuget.tools);
  const [{ download }] = nuget.asked;
  assert.equal(download.expectedBytes, nuget.tools.packages['9.9.9'].bytes);
  assert.ok(download.destination.startsWith(join(target.modelsDir, 'onnxruntime')));
  assert.deepEqual(progress, [nuget.tools.packages['9.9.9'].bytes]);
  assert.deepEqual(readdirSync(target.binFolder).sort(), ['libonnxruntime_providers_cuda.so', 'libonnxruntime_providers_shared.so']);
  assert.deepEqual(readFileSync(join(target.binFolder, 'libonnxruntime_providers_cuda.so')), PROVIDER);
  assert.equal(existsSync(download.destination), false);
});

test('a package whose sha512 is not the known one is refused and removed; nothing is extracted', async () => {
  const target = folders();
  const nuget = fakeNuget(realPackage, true);
  await assert.rejects(installOrtCuda(target, quiet, nuget.tools), /não confere/);
  assert.deepEqual(readdirSync(target.binFolder), []);
  assert.equal(existsSync(nuget.asked[0].download.destination), false);
});

test('a read-only ONNX Runtime folder is refused readably before anything is downloaded', { skip: process.platform === 'win32' ? 'POSIX folder modes' : process.getuid?.() === 0 }, async () => {
  const target = folders();
  chmodSync(target.binFolder, 0o555);
  let downloaded = false;
  await assert.rejects(installOrtCuda(target, quiet, { download: async () => { downloaded = true; }, packages: fakeNuget(realPackage).tools.packages }), /não aceita escrita/);
  assert.equal(downloaded, false);
  chmodSync(target.binFolder, 0o755);
});

test('a package without the provider fails readably, is removed and leaves no half provider behind', async () => {
  const target = folders();
  const nuget = fakeNuget((path) => fakePackage(path, { 'other.txt': Buffer.from('x') }));
  await assert.rejects(installOrtCuda(target, quiet, nuget.tools), /libonnxruntime_providers_/);
  assert.deepEqual(readdirSync(target.binFolder), []);
  assert.equal(existsSync(nuget.asked[0].download.destination), false);
});
