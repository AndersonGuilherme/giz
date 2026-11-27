import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { freeBytesOf } from '../../../src/main/adapters/diskSpace.ts';

test('the free space of a folder that does not exist yet is the one of its nearest existing parent', async () => {
  const existing = await freeBytesOf(tmpdir());
  assert.ok(existing !== null && existing > 0);
  const missing = await freeBytesOf(join(tmpdir(), 'giz-nao-existe', 'modelos'));
  assert.ok(missing !== null && Math.abs(missing - existing) < 1e9);
});
