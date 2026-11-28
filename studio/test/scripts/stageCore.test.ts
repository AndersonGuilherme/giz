import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { coreOutsideTheBundle } from '../../config/coreLocation.ts';
import { leftOut, moduleLeftOut } from '../../scripts/stage/pruning.ts';
import { productionModules } from '../../scripts/stage/productionModules.ts';

function module(root: string, path: string, manifest: object = {}): void {
  mkdirSync(join(root, path), { recursive: true });
  writeFileSync(join(root, path, 'package.json'), JSON.stringify(manifest));
}

test('the built main process reaches core by a path from .vite/build that is right in a checkout and in resources/', () => {
  assert.equal(coreOutsideTheBundle('giz-core/src/presentation/cli/composition.ts'), '../../../core/src/presentation/cli/composition.ts');
  assert.equal(coreOutsideTheBundle('giz-core-other/x.ts'), 'giz-core-other/x.ts');
});

test('the staged modules are what the production dependencies reach, as Node finds them, without the build-only roots', () => {
  const root = mkdtempSync(join(tmpdir(), 'giz-stage-'));
  module(root, '.', { dependencies: { renderer: '1', '@remotion/bundler': '1', sharp: '1' } });
  module(root, 'node_modules/renderer', { dependencies: { ws: '1' }, optionalDependencies: { 'compositor-linux': '1', 'compositor-win32': '1' } });
  module(root, 'node_modules/ws');
  module(root, 'node_modules/compositor-linux');
  module(root, 'node_modules/@remotion/bundler', { dependencies: { webpack: '1' } });
  module(root, 'node_modules/webpack');
  module(root, 'node_modules/sharp', { dependencies: { semver: '7' } });
  module(root, 'node_modules/semver');
  module(root, 'node_modules/sharp/node_modules/semver');
  assert.deepEqual(productionModules(root), [
    'node_modules/compositor-linux', 'node_modules/renderer', 'node_modules/sharp', 'node_modules/sharp/node_modules/semver', 'node_modules/ws',
  ]);
});

test("pruned: maps, links, nested modules, other machines' ONNX Runtime, the CUDA provider, a developer's Whisper cache, musl builds", () => {
  assert.equal(leftOut('node_modules/remotion', 'dist/index.js.map'), true);
  assert.equal(leftOut('node_modules/sharp', 'node_modules'), true);
  assert.equal(leftOut('node_modules/@huggingface/transformers', '.cache'), true);
  assert.equal(leftOut('node_modules/@huggingface/transformers', 'dist/transformers.node.mjs'), false);
  const ort = 'node_modules/onnxruntime-node';
  const other = process.platform === 'win32' ? 'linux' : 'win32';
  assert.equal(leftOut(ort, `bin/napi-v6/${other}`), true);
  assert.equal(leftOut(ort, `bin/napi-v6/${process.platform}`), false);
  assert.equal(leftOut(ort, `bin/napi-v6/${process.platform}/${process.arch}/onnxruntime_binding.node`), false);
  assert.equal(leftOut(ort, `bin/napi-v6/${process.platform}/${process.arch === 'x64' ? 'arm64' : 'x64'}`), true);
  assert.equal(leftOut(ort, 'bin/napi-v6/linux/x64/libonnxruntime_providers_cuda.so'), true);
  assert.equal(moduleLeftOut('node_modules/@remotion/compositor-linux-x64-musl'), true);
  assert.equal(moduleLeftOut('node_modules/@remotion/compositor-linux-x64-gnu'), false);
});

test("pruned too: tests, examples, docs, Markdown and type declarations inside the modules; licenses stay", () => {
  for (const path of ['test', 'lib/tests', 'example', 'examples', 'docs', 'README.md', 'docs/guide.md', 'dist/index.d.ts', 'dist/index.d.mts', 'dist/index.d.cts']) {
    assert.equal(leftOut('node_modules/zod', path), true, path);
  }
  for (const path of ['LICENSE', 'LICENSE.md', 'NOTICE.md', 'dist/index.js', 'dist/testing.js', 'package.json']) assert.equal(leftOut('node_modules/zod', path), false, path);
});
