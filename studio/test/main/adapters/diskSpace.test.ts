import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { freeBytesOf } from '../../../src/main/adapters/diskSpace.ts';

test('the free space of a folder that does not exist yet is the one of its nearest existing parent', async () => {
  const existing = await freeBytesOf(tmpdir());
  assert.ok(existing !== null && existing > 0);
  const missing = await freeBytesOf(join(tmpdir(), 'gizzy-nao-existe', 'modelos'));
  assert.ok(missing !== null && Math.abs(missing - existing) < 1e9);
});

test('the bytes a stopped download left are counted, files in subfolders and .part files included', async () => {
  const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises');
  const { bytesIn } = await import('../../../src/main/adapters/diskSpace.ts');
  const folder = await mkdtemp(join(tmpdir(), 'gizzy-bytes-'));
  await mkdir(join(folder, 'onnx'));
  await writeFile(join(folder, 'config.json'), '12345');
  await writeFile(join(folder, 'onnx', 'talker.onnx.part'), '123');
  assert.equal(await bytesIn(folder), 8);
  assert.equal(await bytesIn(join(folder, 'nada')), 0);
});
