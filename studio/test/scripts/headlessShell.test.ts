import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureHeadlessShellArchive, HEADLESS_SHELL_VERSION, HEADLESS_SHELLS, pinnedShellFor, remotionTestedVersion } from '../../scripts/headlessShell.ts';

const sha256 = (data: string) => createHash('sha256').update(data).digest('hex');
const serving = (body: string) => (async () => new Response(body)) as unknown as typeof fetch;
const CORE = fileURLToPath(new URL('../../../core', import.meta.url));

test('Chrome Headless Shell is pinned to the version the installed Remotion was tested with, per platform, with a sha256', () => {
  assert.equal(remotionTestedVersion(CORE), HEADLESS_SHELL_VERSION, 'a Remotion upgrade must update scripts/headlessShell.ts');
  for (const pinned of Object.values(HEADLESS_SHELLS)) {
    assert.match(pinned.url, new RegExp(`^https://remotion\\.media/chromium-headless-shell-[a-z0-9-]+-${HEADLESS_SHELL_VERSION.replaceAll('.', '\\.')}\\.zip\\?clear$`));
    assert.match(pinned.sha256, /^[0-9a-f]{64}$/);
  }
  assert.equal(pinnedShellFor('linux', 'x64').platform, 'linux64');
  assert.equal(pinnedShellFor('win32', 'x64').platform, 'win64');
  assert.equal(pinnedShellFor('darwin', 'arm64').platform, 'mac-arm64');
  assert.throws(() => pinnedShellFor('linux', 'arm64'), /headlessShell\.ts/);
});

test('the archive is downloaded once and kept only when its sha256 is the pinned one', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'giz-shell-'));
  const pinned = { url: 'https://example.invalid/shell.zip', sha256: sha256('shell bytes') };
  const path = await ensureHeadlessShellArchive(join(folder, 'shell.zip'), pinned, serving('shell bytes'));
  assert.equal(readFileSync(path, 'utf8'), 'shell bytes');
  const again = await ensureHeadlessShellArchive(path, pinned, (async () => assert.fail('no second download')) as unknown as typeof fetch);
  assert.equal(again, path);
});

test('an archive that is not the pinned one is refused and not kept', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'giz-shell-'));
  const pinned = { url: 'https://example.invalid/shell.zip', sha256: sha256('the real one') };
  await assert.rejects(ensureHeadlessShellArchive(join(folder, 'shell.zip'), pinned, serving('something else')), /sha256/);
  assert.equal(existsSync(join(folder, 'shell.zip')), false);
});

test("Remotion's tested version is read from the installed renderer", () => {
  const renderer = createRequire(join(CORE, 'package.json')).resolve('@remotion/renderer');
  assert.ok(existsSync(renderer));
  assert.match(remotionTestedVersion(CORE), /^\d+\.\d+\.\d+\.\d+$/);
});
