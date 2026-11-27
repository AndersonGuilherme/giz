import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProjectsService } from '../../../src/main/services/ProjectsService.ts';
import { FolderGrants } from '../../../src/main/services/FolderGrants.ts';
import { FakeScriptCore, IDEA, MemoryDisk, MemoryOpened, MemoryTrash, STAGES } from '../../doubles/scriptFakes.ts';

const ROOT = '/home/ana/giz/projetos';
const PROFILE = { version: 2, title: 'Gatos', format: 'story', language: 'pt-BR', aspect: '9:16', cast: ['bia'] };

function setup(root: string | null = ROOT) {
  const disk = new MemoryDisk();
  const core = new FakeScriptCore();
  const opened = new MemoryOpened();
  const grants = new FolderGrants();
  if (root) grants.grant(root);
  const trash = new MemoryTrash(disk);
  const service = new ProjectsService({ core, disk, trash, grants, opened, projectsFolder: async () => root });
  return { disk, core, opened, grants, trash, service };
}

test('the list has the projects of the projects folder and the remembered ones, newest first, with profile and stages', async () => {
  const { disk, service, opened, grants } = setup();
  disk.put(`${ROOT}/gatos`, 'project.json', PROFILE);
  disk.times.set(`${ROOT}/gatos`, 200);
  disk.put(`${ROOT}/so-ideia`, 'idea.json', { ...IDEA, theme: 'Uma ideia' });
  disk.times.set(`${ROOT}/so-ideia`, 300);
  disk.put(`${ROOT}/fotos`, 'foto.json', {});
  disk.times.set(`${ROOT}/fotos`, 999);
  disk.put('/outro/aula', 'project.json', { ...PROFILE, title: 'Aula', format: 'lesson' });
  disk.times.set('/outro/aula', 100);
  opened.folders = ['/outro/aula', '/sumiu'];
  const list = await service.list();
  assert.deepEqual(list.map(({ folder }) => folder), [`${ROOT}/so-ideia`, `${ROOT}/gatos`, '/outro/aula']);
  assert.deepEqual(list[1], { folder: `${ROOT}/gatos`, title: 'Gatos', format: 'story', aspect: '9:16', language: 'pt-BR', stages: STAGES, modified: 200 });
  assert.equal(list[0]!.title, 'Uma ideia', 'a project at the idea stage is named by its theme');
  assert.equal(grants.require('/outro/aula/script.json'), '/outro/aula/script.json', 'a remembered folder is granted again');
});

test('a project whose project.json is broken is still listed, with the problem; its stages that fail are empty', async () => {
  const { disk, core, service } = setup();
  disk.files.set(`${ROOT}/quebrado/project.json`, '{');
  core.stagesFail.add(`${ROOT}/quebrado`);
  disk.readJson = async (folder, file) => {
    if (folder.endsWith('quebrado') && file === 'project.json') throw new Error('project.json não é um JSON válido');
    throw new Error(`${file} não foi encontrado`);
  };
  const [listing] = await service.list();
  assert.equal(listing!.problem, 'project.json não é um JSON válido');
  assert.deepEqual(listing!.stages, []);
});

test('a new project gets a free folder named after the theme, and core starts it there', async () => {
  const { disk, core, service } = setup();
  disk.put(`${ROOT}/e-se-os-gatos-falassem`, 'project.json', PROFILE);
  const folder = await service.create(IDEA);
  assert.equal(folder, `${ROOT}/e-se-os-gatos-falassem-2`);
  assert.deepEqual(core.started, [{ idea: IDEA, folder }]);
});

test('without a projects folder nothing is created', async () => {
  const { service } = setup(null);
  await assert.rejects(service.create(IDEA), { code: 'invalid-request' });
});

test('a copy goes into the projects folder without its output, with "(cópia)" after its title', async () => {
  const { disk, service } = setup();
  disk.put('/outro/aula', 'project.json', PROFILE);
  disk.put('/outro/aula', 'script.json', { chapters: ['x'], lines: [] });
  disk.put('/outro/aula', 'output/video.json', {});
  await service.remember('/outro/aula');
  const copy = await service.duplicate('/outro/aula');
  assert.equal(copy, `${ROOT}/aula-copia`);
  assert.equal((await disk.readJson(copy, 'project.json') as { title: string }).title, 'Gatos (cópia)');
  assert.equal(await disk.exists(`${copy}/script.json`), true);
  assert.equal(await disk.exists(`${copy}/output`), false);
});

test('trash moves a project folder to the trash and forgets it; never the projects folder, a non-project or an ungranted folder', async () => {
  const { disk, service, trash, opened } = setup();
  disk.put(`${ROOT}/gatos`, 'project.json', PROFILE);
  disk.put('/outro/aula', 'project.json', PROFILE);
  disk.put(`${ROOT}/fotos`, 'foto.json', {});
  await service.remember('/outro/aula');
  assert.equal(await service.trash('/outro/aula'), true);
  assert.deepEqual(opened.folders, []);
  await service.trash(`${ROOT}/gatos`);
  assert.deepEqual(trash.trashed, ['/outro/aula', `${ROOT}/gatos`]);
  await assert.rejects(service.trash(ROOT), { code: 'invalid-request' });
  await assert.rejects(service.trash(`${ROOT}/fotos`), { code: 'invalid-request' });
  await assert.rejects(service.trash('/home/ana/documentos'), { code: 'invalid-request' });
  assert.equal(trash.trashed.length, 2);
});

test('a remembered folder is kept once and granted', async () => {
  const { service, opened, grants } = setup();
  await service.remember('/outro/aula/');
  await service.remember('/outro/aula');
  assert.deepEqual(opened.folders, ['/outro/aula']);
  assert.equal(grants.require('/outro/aula'), '/outro/aula');
});
