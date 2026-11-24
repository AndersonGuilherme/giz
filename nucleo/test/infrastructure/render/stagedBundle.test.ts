import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withPublicDir } from '../../../src/infrastructure/render/stagedBundle.ts';

// A package public folder with one sound, a project voice and an empty scratch folder for the temporary public dir.
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'giz-staged-test-'));
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
