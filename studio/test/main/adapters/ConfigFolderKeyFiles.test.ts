import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigFolderKeyFiles } from '../../../src/main/adapters/ConfigFolderKeyFiles.ts';

async function inTemp(run: (home: string) => Promise<void>): Promise<void> {
  const home = await mkdtemp(join(tmpdir(), 'giz-keyfiles-'));
  try {
    await run(home);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
}

test('a key goes to <folder>/<service>.key, mode 600, in a 700 folder the Studio created; no draft is left; remove deletes it', () => inTemp(async (home) => {
  const folder = join(home, '.config', 'giz');
  const warnings: string[] = [];
  const files = new ConfigFolderKeyFiles(folder, (message) => void warnings.push(message));
  assert.equal(await files.read('fish'), undefined);
  await files.write('fish', 'fk-123');
  assert.equal(await readFile(join(folder, 'fish.key'), 'utf8'), 'fk-123\n');
  assert.equal((await stat(join(folder, 'fish.key'))).mode & 0o777, 0o600);
  assert.equal((await stat(folder)).mode & 0o777, 0o700);
  assert.deepEqual(await readdir(folder), ['fish.key']);
  assert.deepEqual(warnings, []);
  assert.equal(await files.read('fish'), 'fk-123');
  assert.equal(await files.remove('fish'), true);
  assert.equal(await files.remove('fish'), false);
}));

test('an older, readable key file is replaced by a 600 one with the new key; a blank file is no key', () => inTemp(async (folder) => {
  await chmod(folder, 0o700);
  const files = new ConfigFolderKeyFiles(folder, () => undefined);
  await writeFile(join(folder, 'openai.key'), '   \n');
  await chmod(join(folder, 'openai.key'), 0o644);
  assert.equal(await files.read('openai'), undefined);
  await files.write('openai', 'sk-1');
  await files.write('openai', 'sk-2');
  assert.equal(await readFile(join(folder, 'openai.key'), 'utf8'), 'sk-2\n');
  assert.equal((await stat(join(folder, 'openai.key'))).mode & 0o777, 0o600);
  assert.deepEqual(await readdir(folder), ['openai.key']);
}));

test("an existing folder others can read is the person's: left as it is, with a warning", () => inTemp(async (home) => {
  const folder = join(home, 'giz');
  await mkdir(folder);
  await chmod(folder, 0o755);
  const warnings: string[] = [];
  await new ConfigFolderKeyFiles(folder, (message) => void warnings.push(message)).write('gemini', 'g-1');
  assert.equal((await stat(folder)).mode & 0o777, 0o755);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0] ?? '', /podem listar/);
  assert.equal((await stat(join(folder, 'gemini.key'))).mode & 0o777, 0o600);
}));
