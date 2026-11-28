import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { APPIMAGE_RUNTIMES, ensureAppImageRuntime } from '../../scripts/appImageRuntime.ts';

const sha256 = (data: string) => createHash('sha256').update(data).digest('hex');
const serving = (body: string) => (async () => new Response(body)) as unknown as typeof fetch;

test('the AppImage runtime is a fixed release of AppImage/type2-runtime, by architecture, with its sha256', () => {
  assert.match(APPIMAGE_RUNTIMES.x64.url, /^https:\/\/github\.com\/AppImage\/type2-runtime\/releases\/download\/\d{8}\/runtime-x86_64$/);
  assert.match(APPIMAGE_RUNTIMES.arm64.url, /\/runtime-aarch64$/);
  assert.match(APPIMAGE_RUNTIMES.x64.sha256, /^[0-9a-f]{64}$/);
});

test('it is downloaded once and kept only when its sha256 is the pinned one', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'giz-runtime-'));
  const pinned = { url: 'https://example.invalid/runtime', sha256: sha256('runtime bytes') };
  const path = await ensureAppImageRuntime(join(folder, 'runtime'), pinned, serving('runtime bytes'));
  assert.equal(readFileSync(path, 'utf8'), 'runtime bytes');
  const again = await ensureAppImageRuntime(join(folder, 'runtime'), pinned, (async () => assert.fail('no second download')) as unknown as typeof fetch);
  assert.equal(again, path);
});

test('a runtime that is not the pinned one is refused and not kept', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'giz-runtime-'));
  const pinned = { url: 'https://example.invalid/runtime', sha256: sha256('the real one') };
  await assert.rejects(ensureAppImageRuntime(join(folder, 'runtime'), pinned, serving('something else')), /sha256/);
  assert.equal(existsSync(join(folder, 'runtime')), false);
});
