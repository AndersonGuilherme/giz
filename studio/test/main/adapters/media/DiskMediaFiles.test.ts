import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DiskMediaFiles } from '../../../../src/main/adapters/media/DiskMediaFiles.ts';

test('a write makes its folder and leaves no draft; read, exists, modified and remove follow it', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-media-files-'));
  const files = new DiskMediaFiles();
  await files.write(folder, 'recordings/1.wav', new Uint8Array([1, 2, 3]));
  assert.deepEqual([...(await readFile(join(folder, 'recordings', '1.wav')))], [1, 2, 3]);
  assert.deepEqual(await readdir(join(folder, 'recordings')), ['1.wav']);
  assert.deepEqual([...(await files.read(folder, 'recordings/1.wav'))!], [1, 2, 3]);
  assert.equal(await files.exists(folder, 'recordings/1.wav'), true);
  assert.equal(typeof (await files.modified(folder, 'recordings/1.wav')), 'number');
  assert.equal(await files.modified(folder, 'recordings'), undefined);
  await files.remove(folder, 'recordings/1.wav');
  assert.equal(await files.exists(folder, 'recordings/1.wav'), false);
});

test('a file named outside the project (../) is never read nor written', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-media-files-'));
  const files = new DiskMediaFiles();
  await assert.rejects(files.write(folder, '../escape.png', new Uint8Array([1])), /fora da pasta do projeto/);
  assert.equal(await files.read(folder, '../../etc/passwd'), undefined);
  assert.equal(await files.modified(folder, '/etc/passwd'), undefined);
});
