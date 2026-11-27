import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigFolderKeyFiles } from '../../../src/main/adapters/ConfigFolderKeyFiles.ts';

test('a key goes to <folder>/<service>.key with mode 600 in a 700 folder, as the CLI reads it; remove deletes it', async () => {
  const home = await mkdtemp(join(tmpdir(), 'giz-keyfiles-'));
  try {
    const folder = join(home, '.config', 'giz');
    const files = new ConfigFolderKeyFiles(folder);
    assert.equal(await files.read('fish'), undefined);
    await files.write('fish', 'fk-123');
    assert.equal(await readFile(join(folder, 'fish.key'), 'utf8'), 'fk-123\n');
    assert.equal((await stat(join(folder, 'fish.key'))).mode & 0o777, 0o600);
    assert.equal((await stat(folder)).mode & 0o777, 0o700);
    assert.equal(await files.read('fish'), 'fk-123');
    assert.equal(await files.remove('fish'), true);
    assert.equal(await files.remove('fish'), false);
    assert.equal(await files.read('fish'), undefined);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test('an older, readable key file becomes mode 600 when rewritten; a blank file is no key', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-keyfiles-'));
  try {
    const files = new ConfigFolderKeyFiles(folder);
    await writeFile(join(folder, 'openai.key'), '   \n');
    await chmod(join(folder, 'openai.key'), 0o644);
    assert.equal(await files.read('openai'), undefined);
    await files.write('openai', 'sk-1');
    assert.equal((await stat(join(folder, 'openai.key'))).mode & 0o777, 0o600);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
