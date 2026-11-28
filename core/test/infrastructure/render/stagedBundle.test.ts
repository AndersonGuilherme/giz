import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withBundle, withPublicDir } from '../../../src/infrastructure/render/stagedBundle.ts';

// A package public folder with one sound, a project voice and an empty scratch folder for the temporary public dir.
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'gizzy-staged-test-'));
  const publicFolder = join(root, 'public');
  await mkdir(join(publicFolder, 'sounds'), { recursive: true });
  await writeFile(join(publicFolder, 'sounds', 'pop.wav'), 'pop');
  await writeFile(join(root, 'voz.wav'), 'voz');
  const scratch = join(root, 'scratch');
  await mkdir(scratch);
  const sources = { entryPoint: join(root, 'index.ts'), publicFolder, scratch };
  return { root, sources, scratch, cleanup: () => rm(root, { recursive: true, force: true }) };
}

test('the public dir holds the package files and the staged files, and is removed after use', async () => {
  const { root, sources, scratch, cleanup } = await setup();
  const seen = await withPublicDir(sources, [{ from: join(root, 'voz.wav'), at: 'voice/1.wav' }], async (publicDir) => ({
    sound: await readFile(join(publicDir, 'sounds', 'pop.wav'), 'utf8'),
    voice: await readFile(join(publicDir, 'voice', '1.wav'), 'utf8'),
    publicDir,
  }));
  assert.deepEqual([seen.sound, seen.voice], ['pop', 'voz']);
  assert.equal(existsSync(seen.publicDir), false);
  assert.deepEqual(await readdir(scratch), []);
  await cleanup();
});

test('a missing file fails the staging and still leaves no temporary dir behind', async () => {
  const { root, sources, scratch, cleanup } = await setup();
  let used = false;
  const missing = [{ from: join(root, 'nao-existe.wav'), at: 'voice/2.wav' }];
  await assert.rejects(withPublicDir(sources, missing, async () => { used = true; }), /nao-existe\.wav/);
  assert.equal(used, false);
  assert.deepEqual(await readdir(scratch), []);
  await cleanup();
});

test('an error in the use (a webpack or render failure) still removes the temporary dir', async () => {
  const { sources, scratch, cleanup } = await setup();
  await assert.rejects(withPublicDir(sources, [], async () => { throw new Error('webpack quebrou'); }), /webpack quebrou/);
  assert.deepEqual(await readdir(scratch), []);
  await cleanup();
});

test('a staged file outside the public dir, or taken from outside the project, is refused before any copy', async () => {
  const { root, sources, scratch, cleanup } = await setup();
  const escaping = [{ from: join(root, 'voz.wav'), at: '../escaped.wav' }];
  await assert.rejects(withPublicDir(sources, escaping, async () => undefined), /"\.\.\/escaped\.wav" sai da pasta pública/);
  const outside = [{ from: join(root, 'voz.wav'), at: 'voice/1.wav', project: join(root, 'project') }];
  await assert.rejects(withPublicDir(sources, outside, async () => undefined), /voz\.wav está fora da pasta do projeto/);
  assert.equal(existsSync(join(root, 'escaped.wav')), false);
  assert.deepEqual(await readdir(scratch), []);
  await cleanup();
});

test('a bundle made at package time is copied with the staged files in its public folder: no webpack, and it is left as it was', async () => {
  const { root, sources, scratch, cleanup } = await setup();
  const prebuilt = join(root, 'remotion-bundle');
  await mkdir(join(prebuilt, 'public', 'sounds'), { recursive: true });
  await writeFile(join(prebuilt, 'index.html'), '<html>');
  await writeFile(join(prebuilt, 'public', 'sounds', 'pop.wav'), 'pop');
  const seen = await withBundle({ ...sources, entryPoint: join(root, 'missing-entry.ts'), prebuilt }, [{ from: join(root, 'voz.wav'), at: 'voice/1.wav' }], async (serveUrl) => ({
    page: await readFile(join(serveUrl, 'index.html'), 'utf8'),
    sound: await readFile(join(serveUrl, 'public', 'sounds', 'pop.wav'), 'utf8'),
    voice: await readFile(join(serveUrl, 'public', 'voice', '1.wav'), 'utf8'),
    serveUrl,
  }));
  assert.deepEqual([seen.page, seen.sound, seen.voice], ['<html>', 'pop', 'voz']);
  assert.notEqual(seen.serveUrl, prebuilt);
  assert.equal(existsSync(seen.serveUrl), false);
  assert.deepEqual(await readdir(scratch), []);
  assert.deepEqual((await readdir(prebuilt, { recursive: true })).sort(), ['index.html', 'public', 'public/sounds', 'public/sounds/pop.wav']);
  await cleanup();
});

test('a prebuilt bundle still refuses a staged file from outside the project and leaves nothing behind', async () => {
  const { root, sources, scratch, cleanup } = await setup();
  const prebuilt = join(root, 'remotion-bundle');
  await mkdir(prebuilt);
  const outside = [{ from: join(root, 'voz.wav'), at: 'voice/1.wav', project: join(root, 'project') }];
  await assert.rejects(withBundle({ ...sources, prebuilt }, outside, async () => undefined), /fora da pasta do projeto/);
  assert.deepEqual(await readdir(scratch), []);
  await cleanup();
});

test('the prebuilt bundle is <package>/remotion-bundle when the package ships one (the installed Studio), else none', async () => {
  const { prebuiltBundleIn } = await import('../../../src/infrastructure/render/stagedBundle.ts');
  assert.equal(prebuiltBundleIn('/app/core', (path) => path === '/app/core/remotion-bundle/index.html'), '/app/core/remotion-bundle');
  assert.equal(prebuiltBundleIn('/repo/core', () => false), undefined);
});

test('a read-only prebuilt bundle (an app installed by the system) is copied into a writable folder and removed after use', { skip: process.platform === 'win32' ? 'POSIX folder modes' : process.getuid?.() === 0 }, async () => {
  const { root, sources, scratch, cleanup } = await setup();
  const prebuilt = join(root, 'remotion-bundle');
  await mkdir(join(prebuilt, 'public', 'fonts'), { recursive: true });
  await writeFile(join(prebuilt, 'public', 'fonts', 'Nunito.ttf'), 'font');
  for (const path of [join(prebuilt, 'public', 'fonts', 'Nunito.ttf'), join(prebuilt, 'public', 'fonts'), join(prebuilt, 'public'), prebuilt]) chmodSync(path, 0o555);
  const voice = await withBundle({ ...sources, prebuilt }, [{ from: join(root, 'voz.wav'), at: 'fonts/extra.wav' }], (serveUrl) => readFile(join(serveUrl, 'public', 'fonts', 'extra.wav'), 'utf8'));
  assert.equal(voice, 'voz');
  assert.deepEqual(await readdir(scratch), []);
  for (const path of [prebuilt, join(prebuilt, 'public'), join(prebuilt, 'public', 'fonts')]) chmodSync(path, 0o755);
  await cleanup();
});

test("each render copies only the bundle's own source map (the renderer reads bundle.js.map), not the chunks' maps", async () => {
  const { root, sources, cleanup } = await setup();
  const prebuilt = join(root, 'remotion-bundle');
  await mkdir(join(prebuilt, 'public'), { recursive: true });
  for (const name of ['index.html', 'bundle.js', 'bundle.js.map', '12.bundle.js', '12.bundle.js.map']) await writeFile(join(prebuilt, name), name);
  const copied = await withBundle({ ...sources, prebuilt }, [], (serveUrl) => readdir(serveUrl));
  assert.deepEqual(copied.sort(), ['12.bundle.js', 'bundle.js', 'bundle.js.map', 'index.html', 'public']);
  await cleanup();
});
