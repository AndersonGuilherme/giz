import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DiskProjects } from '../../../src/main/adapters/DiskProjects.ts';
import { JsonOpenedFolders } from '../../../src/main/adapters/JsonOpenedFolders.ts';
import { RehearsalTrash } from '../../../src/main/adapters/rehearsal/RehearsalTrash.ts';

async function withFolder(use: (folder: string) => Promise<void>): Promise<void> {
  const folder = await mkdtemp(join(tmpdir(), 'giz-disk-'));
  try {
    await use(folder);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}

const disk = new DiskProjects();

test('writeJson replaces the file through a draft: only the file is left, pretty-printed', async () => {
  await withFolder(async (folder) => {
    await writeFile(join(folder, 'script.json'), 'velho');
    await disk.writeJson(folder, 'script.json', { lines: [] });
    assert.deepEqual(await readdir(folder), ['script.json']);
    assert.equal(await readFile(join(folder, 'script.json'), 'utf8'), '{\n  "lines": []\n}\n');
    assert.deepEqual(await disk.readJson(folder, 'script.json'), { lines: [] });
  });
});

test('readJson says which file is missing or not JSON, in the interface language', async () => {
  await withFolder(async (folder) => {
    await writeFile(join(folder, 'project.json'), '{');
    await assert.rejects(disk.readJson(folder, 'script.json'), { message: 'script.json não foi encontrado' });
    await assert.rejects(disk.readJson(folder, 'project.json'), { message: 'project.json não é um JSON válido' });
  });
});

test('folders lists the visible folders; copy leaves the skipped entries; modified ignores the output', async () => {
  await withFolder(async (folder) => {
    const project = join(folder, 'gatos');
    await mkdir(join(project, 'output'), { recursive: true });
    await mkdir(join(project, 'cast'));
    await mkdir(join(folder, '.escondida'));
    await writeFile(join(project, 'project.json'), '{}');
    await writeFile(join(project, 'cast', 'bia.json'), '{}');
    await writeFile(join(project, 'output', 'video.mp4'), 'x');
    await utimes(join(project, 'project.json'), 1000, 1000);
    await utimes(join(project, 'cast', 'bia.json'), 2000, 2000);
    await utimes(join(project, 'output', 'video.mp4'), 9000, 9000);
    await utimes(project, 500, 500);
    assert.deepEqual(await disk.folders(folder), [project]);
    assert.deepEqual(await disk.folders(join(folder, 'nada')), []);
    assert.equal(await disk.modified(project), 2_000_000);
    await disk.copy(project, join(folder, 'copia'), ['output']);
    assert.deepEqual((await readdir(join(folder, 'copia'))).sort(), ['cast', 'project.json']);
    await assert.rejects(disk.copy(project, join(folder, 'copia'), []), 'a copy never lands on a folder that exists');
  });
});

test('the opened folders survive a restart; a broken file reads as none', async () => {
  await withFolder(async (folder) => {
    const file = join(folder, 'projects.json');
    await new JsonOpenedFolders(file).write(['/a', '/b']);
    assert.deepEqual(await new JsonOpenedFolders(file).read(), ['/a', '/b']);
    await writeFile(file, '{');
    assert.deepEqual(await new JsonOpenedFolders(file).read(), []);
  });
});

test('the rehearsal trash moves the folder into its own folder', async () => {
  await withFolder(async (folder) => {
    await mkdir(join(folder, 'gatos'));
    await writeFile(join(folder, 'gatos', 'project.json'), '{}');
    await new RehearsalTrash(join(folder, '.lixeira')).trash(join(folder, 'gatos'));
    assert.deepEqual(await readdir(folder), ['.lixeira']);
    const [moved] = await readdir(join(folder, '.lixeira'));
    assert.match(moved ?? '', /^gatos-\d+$/);
  });
});
