import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ProjectFiles } from '../../../src/application/ports/ProjectFolder.ts';
import { DiskProjectFolder } from '../../../src/infrastructure/disk/DiskProjectFolder.ts';

const FILES: ProjectFiles = {
  idea: { format: 'story', aspect: '9:16', targetSeconds: 30, theme: 'T', audience: 'A', tone: 'B', language: 'pt-BR' },
  project: { version: 2, title: 'T' },
  script: { chapters: ['A'], lines: [] },
  cast: [{ id: 'bia', name: 'Bia' }],
};

const folder = new DiskProjectFolder();
const exists = (path: string) => access(path).then(() => true, () => false);

test('save writes idea.json, project.json, script.json and cast/<id>.json, creating the folder', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'giz-folder-'));
  try {
    const target = join(parent, 'novo');
    await folder.save(target, FILES);
    assert.deepEqual(JSON.parse(await readFile(join(target, 'cast', 'bia.json'), 'utf8')), FILES.cast[0]);
    assert.deepEqual(await folder.readIdea(target), FILES.idea);
    assert.deepEqual(JSON.parse(await readFile(join(target, 'script.json'), 'utf8')), FILES.script);
    assert.equal(await folder.storedVoice(target), undefined, 'a project.json without voice');
    await writeFile(join(target, 'project.json'), JSON.stringify({ voice: { provider: 'fish' } }));
    assert.deepEqual(await folder.storedVoice(target), { provider: 'fish' });
    await writeFile(join(target, 'project.json'), '{ quebrado');
    assert.equal(await folder.storedVoice(target), undefined);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test('a draft is staged in a scratch folder that is removed afterwards, even when the use fails', async () => {
  let staged = '';
  const ids = await folder.staged(FILES, async (path) => {
    staged = path;
    return JSON.parse(await readFile(join(path, 'project.json'), 'utf8')).title;
  });
  assert.equal(ids, 'T');
  assert.equal(await exists(staged), false);
  await assert.rejects(folder.staged(FILES, async (path) => { staged = path; throw new Error('falhou'); }), /falhou/);
  assert.equal(await exists(staged), false);
});

test('reading the idea of a folder without one, or with broken JSON, is a readable error', async () => {
  const empty = await mkdtemp(join(tmpdir(), 'giz-folder-'));
  try {
    await assert.rejects(folder.readIdea(empty), { message: `${join(empty, 'idea.json')}: arquivo não encontrado` });
    await writeFile(join(empty, 'idea.json'), '{ nada');
    await assert.rejects(folder.readIdea(empty), { message: /idea\.json: JSON inválido/ });
  } finally {
    await rm(empty, { recursive: true, force: true });
  }
});

test('a cast id that is not a valid character id is refused before anything is written (no path escapes)', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'giz-folder-'));
  try {
    const target = join(parent, 'novo');
    const escaping = { ...FILES, cast: [{ id: '../../fora', name: 'Fora' }] };
    await assert.rejects(folder.save(target, escaping), { name: 'DomainError', message: /id de personagem "\.\.\/\.\.\/fora" inválido/ });
    await assert.rejects(folder.staged(escaping, async () => 'nunca'), { name: 'DomainError' });
    assert.equal(await exists(target), false);
    assert.equal(await exists(join(parent, 'fora.json')), false);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test('a failed draft goes beside the folder: the JSON answer indented, or the text as it came, and the problems', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'giz-folder-'));
  try {
    const target = join(parent, 'projeto');
    const path = await folder.keepFailed(`${target}/`, { answer: '{"a":1}', problems: ['p1', 'p2'] });
    assert.equal(path, `${target}.draft`);
    assert.equal(await readFile(join(path, 'answer.json'), 'utf8'), '{\n  "a": 1\n}\n');
    assert.equal(await readFile(join(path, 'problems.txt'), 'utf8'), 'p1\np2\n');
    await folder.keepFailed(target, { answer: 'não é JSON', problems: ['p'] });
    assert.equal(await readFile(join(path, 'answer.txt'), 'utf8'), 'não é JSON');
    assert.equal(await exists(join(path, 'answer.json')), false, 'the older answer is replaced');
    assert.equal(await exists(target), false, 'the project folder is never created');
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
