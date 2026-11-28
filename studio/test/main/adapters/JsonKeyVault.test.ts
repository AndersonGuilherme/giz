import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonKeyVault } from '../../../src/main/adapters/JsonKeyVault.ts';

test('no file yet reads as no keys; a write is readable back and only by this user', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'gizzy-vault-'));
  try {
    const vault = new JsonKeyVault(join(folder, 'studio', 'keys.json'));
    assert.deepEqual(await vault.read(), {});
    await vault.write({ openai: 'c2VhbGVk' });
    assert.deepEqual(await vault.read(), { openai: 'c2VhbGVk' });
    const { mode } = await stat(join(folder, 'studio', 'keys.json'));
    assert.equal(mode & 0o777, 0o600);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test('an unreadable vault fails with a pt-BR message, the raw error in the details; overlapping writes leave no tmp files', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'gizzy-vault-'));
  try {
    const file = join(folder, 'keys.json');
    const vault = new JsonKeyVault(file);
    await Promise.all([vault.write({ a: '1' }), vault.write({ b: '2' }), vault.write({ c: '3' })]);
    assert.deepEqual(await readdir(folder), ['keys.json']);
    await writeFile(file, '{ not json');
    await assert.rejects(vault.read(), (error: Error & { code?: string; details?: string[] }) => {
      assert.equal(error.code, 'unavailable');
      assert.match(error.message, /^Não foi possível ler as chaves guardadas/);
      assert.equal(error.details?.length, 1);
      return true;
    });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
