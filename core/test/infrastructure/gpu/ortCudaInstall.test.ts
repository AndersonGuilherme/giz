import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installOrtCuda, ortCudaPackageUrl } from '../../../src/infrastructure/gpu/ortCudaInstall.ts';
import type { Download, DownloadOptions } from '../../../src/infrastructure/download/resumableDownload.ts';

// adm-zip comes with onnxruntime-node (its own installer reads the NuGet package with it).
const ortRequire = createRequire(createRequire(import.meta.url).resolve('onnxruntime-node/package.json'));
type Zip = { addFile(name: string, data: Buffer): void; writeZip(path: string): void };
const AdmZip = ortRequire('adm-zip') as new () => Zip;

function fakePackage(path: string): void {
  const zip = new AdmZip();
  zip.addFile('runtimes/linux-x64/native/libonnxruntime_providers_cuda.so', Buffer.from('cuda provider libcudart.so.12'));
  zip.addFile('runtimes/linux-x64/native/libonnxruntime_providers_shared.so', Buffer.from('shared'));
  zip.addFile('runtimes/linux-x64/native/libonnxruntime_providers_tensorrt.so', Buffer.from('tensorrt'));
  zip.writeZip(path);
}

function folders() {
  const root = mkdtempSync(join(tmpdir(), 'giz-ort-cuda-'));
  const binFolder = join(root, 'bin');
  mkdirSync(binFolder);
  return { modelsDir: join(root, 'models'), binFolder };
}

test('the provider package is the NuGet one of the same ONNX Runtime version', () => {
  assert.equal(ortCudaPackageUrl('1.31.1'),
    'https://api.nuget.org/v3-flatcontainer/microsoft.ml.onnxruntime.gpu.linux/1.31.1/microsoft.ml.onnxruntime.gpu.linux.1.31.1.nupkg');
});

test('the provider is downloaded (resumable, with progress) into the models folder, extracted next to ONNX Runtime and the package removed', async () => {
  const target = { ...folders(), version: '1.31.1' };
  const asked: Download[] = [];
  const progress: number[] = [];
  const download = async (wanted: Download, options: DownloadOptions = {}) => {
    asked.push(wanted);
    options.onStart?.(100);
    options.onBytes?.(100);
    fakePackage(wanted.destination);
  };
  await installOrtCuda(target, { log: () => undefined, onProgress: (step) => progress.push(step.receivedBytes) }, download);
  assert.equal(asked[0].url, ortCudaPackageUrl('1.31.1'));
  assert.ok(asked[0].destination.startsWith(join(target.modelsDir, 'onnxruntime')));
  assert.deepEqual(progress, [100]);
  assert.deepEqual(readdirSync(target.binFolder).sort(), ['libonnxruntime_providers_cuda.so', 'libonnxruntime_providers_shared.so']);
  assert.equal(readFileSync(join(target.binFolder, 'libonnxruntime_providers_cuda.so'), 'utf8'), 'cuda provider libcudart.so.12');
  assert.equal(existsSync(asked[0].destination), false);
});

test('a read-only ONNX Runtime folder (an installed app) is refused readably before anything is downloaded', { skip: process.getuid?.() === 0 }, async () => {
  const target = { ...folders(), version: '1.31.1' };
  chmodSync(target.binFolder, 0o555);
  let downloaded = false;
  const download = async () => { downloaded = true; };
  await assert.rejects(installOrtCuda(target, { log: () => undefined, onProgress: () => undefined }, download), /não aceita escrita/);
  assert.equal(downloaded, false);
  chmodSync(target.binFolder, 0o755);
});

test('a package without the provider fails readably and leaves no half provider behind', async () => {
  const target = { ...folders(), version: '1.31.1' };
  const download = async (wanted: Download) => {
    const zip = new AdmZip();
    zip.addFile('other.txt', Buffer.from('x'));
    zip.writeZip(wanted.destination);
  };
  await assert.rejects(installOrtCuda(target, { log: () => undefined, onProgress: () => undefined }, download), /libonnxruntime_providers_/);
  assert.deepEqual(readdirSync(target.binFolder), []);
  writeFileSync(join(target.binFolder, 'keep'), '');
});
