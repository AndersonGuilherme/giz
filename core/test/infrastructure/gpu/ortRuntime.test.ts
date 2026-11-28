import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyOrtRuntime, ortPackageFolder, ortRuntimeFolder } from '../../../src/infrastructure/gpu/ortRuntime.ts';

const RUNTIME = fileURLToPath(new URL('../../../src/infrastructure/gpu/ortRuntime.ts', import.meta.url));

test('without GIZZY_ORT_DIR the runtime is the package\'s own folder; with it, a per-version, per-machine copy there', () => {
  assert.equal(ortRuntimeFolder({}), ortPackageFolder());
  const folder = ortRuntimeFolder({ GIZZY_ORT_DIR: '/data/onnxruntime' });
  assert.match(folder, new RegExp(`^${'/data/onnxruntime'.replace(/\//g, '[\\\\/]')}[\\\\/]\\d+\\.\\d+\\.\\d+[\\\\/]${process.platform}-${process.arch}$`));
});

test('the copy takes the library and the binding, never a CUDA provider, and lands whole', async () => {
  const from = mkdtempSync(join(tmpdir(), 'gizzy-ort-from-'));
  for (const name of ['libonnxruntime.so.1', 'onnxruntime_binding.node', 'libonnxruntime_providers_cuda.so', 'libonnxruntime_providers_shared.so']) writeFileSync(join(from, name), name);
  const to = join(mkdtempSync(join(tmpdir(), 'gizzy-ort-to-')), '1.0.0', 'linux-x64');
  await copyOrtRuntime(from, to);
  assert.deepEqual(readdirSync(to).sort(), ['libonnxruntime.so.1', 'onnxruntime_binding.node']);
  await copyOrtRuntime(from, to);
  assert.deepEqual(readdirSync(to).sort(), ['libonnxruntime.so.1', 'onnxruntime_binding.node']);
});

// In a child process (the hook is for the whole process): a writable copy with a CUDA provider makes onnxruntime-node
// load its binding from the copy; without the provider, nothing is redirected.
function loadedBinding(withProvider: boolean): { used: boolean; binding: string; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'gizzy-ort-dir-'));
  const env = { ...process.env, GIZZY_ORT_DIR: dir };
  const script = `
    import { createRequire } from 'node:module';
    import { copyOrtRuntime, ortPackageFolder, ortRuntimeFolder, useWritableOrt } from ${JSON.stringify(RUNTIME)};
    import { writeFileSync } from 'node:fs';
    import { join } from 'node:path';
    await copyOrtRuntime(ortPackageFolder(), ortRuntimeFolder());
    if (${withProvider}) writeFileSync(join(ortRuntimeFolder(), 'libonnxruntime_providers_cuda.so'), '');
    const used = useWritableOrt();
    await import('onnxruntime-node');
    const binding = Object.keys(createRequire(import.meta.url).cache).find((key) => key.endsWith('onnxruntime_binding.node'));
    console.log(JSON.stringify({ used, binding }));`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], { env, encoding: 'utf8', cwd: fileURLToPath(new URL('../../..', import.meta.url)) });
  assert.equal(run.status, 0, run.stderr);
  return { ...JSON.parse(run.stdout.trim().split('\n').pop() ?? '{}'), dir } as { used: boolean; binding: string; dir: string };
}

test('with the GPU installed in the copy, onnxruntime-node loads its binding (and so the provider) from the copy', () => {
  const { used, binding, dir } = loadedBinding(true);
  assert.equal(used, true);
  assert.equal(binding, join(ortRuntimeFolder({ GIZZY_ORT_DIR: dir }), 'onnxruntime_binding.node'), 'loaded from the copy, not the package');
});

test('without a provider in the copy, onnxruntime-node keeps its own binding', () => {
  const { used, binding } = loadedBinding(false);
  assert.equal(used, false);
  assert.ok(binding.includes('node_modules'), binding);
  assert.equal(existsSync(binding), true);
});
