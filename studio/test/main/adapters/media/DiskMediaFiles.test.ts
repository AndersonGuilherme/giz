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

test('a link inside the project that points outside is never followed: no write, read, exists nor remove through it', async () => {
  const { mkdir, symlink, writeFile, access } = await import('node:fs/promises');
  const root = await mkdtemp(join(tmpdir(), 'giz-media-links-'));
  const [folder, outside] = [join(root, 'project'), join(root, 'outside')];
  await Promise.all([mkdir(join(folder, 'scenes'), { recursive: true }), mkdir(outside)]);
  await writeFile(join(outside, 'secret.png'), 'segredo');
  await symlink(outside, join(folder, 'scenes', 'own'));
  await symlink(join(outside, 'secret.png'), join(folder, 'voice.wav'));
  const files = new DiskMediaFiles();
  await assert.rejects(files.write(folder, 'scenes/own/1.png', new Uint8Array([1])), /fora da pasta do projeto/);
  await assert.rejects(access(join(outside, '1.png')));
  assert.equal(await files.read(folder, 'scenes/own/secret.png'), undefined);
  assert.equal(await files.read(folder, 'voice.wav'), undefined);
  assert.equal(await files.exists(folder, 'scenes/own/secret.png'), false);
  await assert.rejects(files.remove(folder, 'scenes/own/secret.png'), /fora da pasta do projeto/);
  await access(join(outside, 'secret.png'));
  await files.write(folder, 'scenes/fine/1.png', new Uint8Array([2]));
  assert.deepEqual([...(await files.read(folder, 'scenes/fine/1.png'))!], [2], 'an ordinary new folder still works');
});

test('entries: the files right inside a folder with their last change (not its subfolders); none for a missing folder', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-media-entries-'));
  const files = new DiskMediaFiles();
  await files.write(folder, 'a.wav', new Uint8Array([1]));
  await files.write(folder, 'sub/b.wav', new Uint8Array([2]));
  const entries = await files.entries(folder);
  assert.deepEqual(entries.map(({ file }) => file), ['a.wav']);
  assert.equal(typeof entries[0]!.modified, 'number');
  assert.deepEqual(await files.entries(join(folder, 'nowhere')), []);
});

test('isFolder: a folder inside the project; never a file, a missing name nor a link leading out', async () => {
  const { mkdir, symlink, writeFile } = await import('node:fs/promises');
  const root = await mkdtemp(join(tmpdir(), 'giz-media-folders-'));
  const [folder, outside] = [join(root, 'project'), join(root, 'outside')];
  await Promise.all([mkdir(join(folder, 'output'), { recursive: true }), mkdir(outside)]);
  await writeFile(join(folder, 'script.json'), '{}');
  await symlink(outside, join(folder, 'elsewhere'));
  const files = new DiskMediaFiles();
  assert.equal(await files.isFolder(folder, 'output'), true);
  assert.equal(await files.isFolder(folder, 'script.json'), false);
  assert.equal(await files.isFolder(folder, 'missing'), false);
  assert.equal(await files.isFolder(folder, 'elsewhere'), false);
  assert.equal(await files.isFolder(folder, '..'), false);
});
