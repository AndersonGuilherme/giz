import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cudaLibraryFolder, cudaManifestUrl } from '../../../src/infrastructure/gpu/cudaLibraries.ts';
import { parseNvidiaSmi } from '../../../src/infrastructure/gpu/nvidiaGpu.ts';
import { cudaMajorIn } from '../../../src/infrastructure/gpu/onnxRuntimeCuda.ts';
import { preloadOrder } from '../../../src/infrastructure/gpu/preloadCuda.ts';

test('nvidia-smi output: name, memory in MiB and driver of the first GPU', () => {
  assert.deepEqual(parseNvidiaSmi('NVIDIA GeForce RTX 5060 Ti, 16311, 581.57\nOther, 1, 2\n'), {
    name: 'NVIDIA GeForce RTX 5060 Ti', memoryMiB: 16311, driver: '581.57',
  });
});

test('the CUDA major version is read from the provider binary', () => {
  assert.equal(cudaMajorIn('\u0000libcublas.so.13\u0000libcudart.so.13\u0000'), 13);
  assert.throws(() => cudaMajorIn('nada aqui'), /versão do CUDA/);
});

test('the libraries live in <modelsDir>/cuda/<major>/lib', () => {
  assert.equal(cudaLibraryFolder('/home/x/.cache/giz', 13), '/home/x/.cache/giz/cuda/13/lib');
});

test('CUDA 12 uses the fixed 12.9.1 manifest; 13 the last 13.0.x patch listed by NVIDIA', async () => {
  const neverCalled = (async () => assert.fail('no fetch for CUDA 12')) as unknown as typeof fetch;
  assert.match(await cudaManifestUrl(12, neverCalled), /redistrib_12\.9\.1\.json$/);
  const index = '<a href="redistrib_13.0.2.json">x</a> redistrib_13.0.10.json redistrib_13.1.0.json redistrib_13.0.2.json';
  const send = (async () => new Response(index)) as unknown as typeof fetch;
  assert.match(await cudaManifestUrl(13, send), /redistrib_13\.0\.10\.json$/);
  const empty = (async () => new Response('')) as unknown as typeof fetch;
  await assert.rejects(cudaManifestUrl(13, empty), /CUDA 13/);
});

test('preload order: runtime, cuBLASLt, cuBLAS, cuRAND, then cuDNN with its main library first; no unversioned links', () => {
  const files = ['libcudnn_cnn.so.9', 'libcurand.so.10', 'libcublas.so.13', 'libcudnn.so.9', 'libcudart.so', 'libcudart.so.13',
    'libcublasLt.so.13', 'libcudnn_adv.so.9', 'libcublas.so.13.1.1.3'];
  const order = preloadOrder(files);
  assert.deepEqual(order.slice(0, 5), ['libcudart.so.13', 'libcublasLt.so.13', 'libcublas.so.13', 'libcurand.so.10', 'libcudnn.so.9']);
  assert.deepEqual(order.slice(5).sort(), ['libcudnn_adv.so.9', 'libcudnn_cnn.so.9']);
});

test('cuda without the ONNX Runtime CUDA provider runs on the CPU with a readable warning; otherwise nothing changes', async () => {
  const { usableDevice } = await import('../../../src/infrastructure/gpu/deviceChoice.ts');
  const warnings: string[] = [];
  const warn = (message: string) => warnings.push(message);
  assert.equal(usableDevice('cuda', () => false, warn), 'cpu');
  assert.deepEqual(warnings, ['GPU não configurada: rodando na CPU (rode `giz gpu install`)']);
  assert.equal(usableDevice('cuda', () => true, warn), 'cuda');
  assert.equal(usableDevice('cpu', () => assert.fail('not asked'), warn), 'cpu');
  assert.equal(warnings.length, 1);
});

test('the CUDA libraries are ready only once their done marker exists', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { cudaLibrariesReady } = await import('../../../src/infrastructure/gpu/cudaLibraries.ts');
  const modelsDir = mkdtempSync(join(tmpdir(), 'giz-cuda-'));
  assert.equal(cudaLibrariesReady(modelsDir, () => 13), false);
  mkdirSync(join(modelsDir, 'cuda', '13'), { recursive: true });
  writeFileSync(join(modelsDir, 'cuda', '13', '.completo'), 'x');
  assert.equal(cudaLibrariesReady(modelsDir, () => 13), true);
  assert.equal(cudaLibrariesReady(modelsDir, () => { throw new Error('sem provider'); }), false);
});

test('the ONNX Runtime installer runs as Node inside Electron (whose binary is not node) and without the npm variables', async () => {
  const { installerEnvironment } = await import('../../../src/infrastructure/gpu/onnxRuntimeCuda.ts');
  const env = { PATH: '/bin', npm_config_x: '1', ONNXRUNTIME_NODE_INSTALL_CUDA: 'skip' };
  assert.deepEqual(installerEnvironment(env, undefined), { PATH: '/bin' });
  assert.deepEqual(installerEnvironment(env, '45.5.0'), { PATH: '/bin', ELECTRON_RUN_AS_NODE: '1' });
});
