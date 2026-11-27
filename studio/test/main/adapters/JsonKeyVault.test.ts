import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonKeyVault } from '../../../src/main/adapters/JsonKeyVault.ts';

test('no file yet reads as no keys; a write is readable back and only by this user', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-vault-'));
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
