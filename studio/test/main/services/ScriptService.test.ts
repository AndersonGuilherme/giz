import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderQueue } from '../../../src/main/services/FolderQueue.ts';
import { ScriptService } from '../../../src/main/services/ScriptService.ts';
import { editorProblemOf } from '../../../src/main/services/editorProblems.ts';
import type { ScriptJson } from '../../../src/shared/script.ts';
import { grantsFor } from '../../doubles/fakes.ts';
import { FakeScriptCore, MemoryDisk, STAGES } from '../../doubles/scriptFakes.ts';

const FOLDER = '/projetos/gatos';
const SCRIPT: ScriptJson = { chapters: ['Um'], lines: [{ id: '01', chapter: 1, speaker: 'bia', text: 'Oi.' }, { id: '02', chapter: 1, speaker: 'narrator', text: 'Era uma vez.' }] };

function setup() {
  const disk = new MemoryDisk();
  disk.put(FOLDER, 'project.json', { title: 'Gatos', format: 'story', aspect: '9:16', language: 'pt-BR', cast: ['bia', 'narrator', '../../etc/passwd'] });
  disk.put(FOLDER, 'cast/bia.json', { id: 'bia', name: 'Bia', rig: 'giz' });
  disk.put(FOLDER, 'cast/narrator.json', { id: 'narrator', name: 'Narrador', voice: { id: 'ryan' } });
  disk.put(FOLDER, 'script.json', SCRIPT);
  const core = new FakeScriptCore();
  return { disk, core, service: new ScriptService({ core, disk, grants: grantsFor('/projetos'), saves: new FolderQueue() }) };
}

test('read gives the profile, the cast (who has a body) and the script; an id that is a path is never read', async () => {
  const { service } = setup();
  const document = await service.read(FOLDER);
  assert.deepEqual(document, {
    folder: FOLDER, title: 'Gatos', format: 'story', aspect: '9:16', language: 'pt-BR',
    cast: [{ id: 'bia', name: 'Bia', body: true }, { id: 'narrator', name: 'Narrador', body: false }], script: SCRIPT,
  });
});

test('no script.json yet opens as an empty script', async () => {
  const { service, disk } = setup();
  disk.files.delete(`${FOLDER}/script.json`);
  assert.deepEqual((await service.read(FOLDER)).script, { chapters: [], lines: [] });
});

test('a script.json that is not a script is a readable failure, and is never saved over', async () => {
  const { service, disk } = setup();
  disk.files.set(`${FOLDER}/script.json`, '{ "chapters": [');
  await assert.rejects(service.read(FOLDER), (error: { code: string; details: string[] }) => {
    assert.equal(error.code, 'invalid-project');
    assert.equal(error.details[0], 'script.json: JSON inválido na linha 1, coluna 16');
    return true;
  });
  await assert.rejects(service.save(FOLDER, SCRIPT), { code: 'invalid-project' });
  assert.equal(disk.files.get(`${FOLDER}/script.json`), '{ "chapters": [');
  disk.files.set(`${FOLDER}/script.json`, '"nada"');
  await assert.rejects(service.read(FOLDER), { code: 'invalid-project' });
});

test('the first save of a run keeps script.json.bak; later saves do not replace it', async () => {
  const { service, disk } = setup();
  const first = { ...SCRIPT, chapters: ['Primeiro'] };
  await service.save(FOLDER, first);
  assert.deepEqual(JSON.parse(disk.files.get(`${FOLDER}/script.json.bak`) ?? 'null'), SCRIPT);
  await service.save(FOLDER, { ...SCRIPT, chapters: ['Segundo'] });
  assert.deepEqual(JSON.parse(disk.files.get(`${FOLDER}/script.json.bak`) ?? 'null'), SCRIPT);
});

test('two overlapping saves of a folder run one after the other: the newer one ends on disk', async () => {
  const { service, disk } = setup();
  disk.writeDelays = [40, 0];
  const older = service.save(FOLDER, { ...SCRIPT, chapters: ['Antiga'] });
  const newer = service.save(FOLDER, { ...SCRIPT, chapters: ['Nova'] });
  await Promise.all([older, newer, service.settled()]);
  assert.deepEqual(JSON.parse(disk.files.get(`${FOLDER}/script.json`) ?? 'null').chapters, ['Nova']);
});

test('save writes script.json, then answers the check placed on its lines and the stages', async () => {
  const { service, disk, core } = setup();
  core.validation = {
    errors: [{ lineId: '02', message: '2 trecho(s) [..] mas 1 beat(s)' }, { file: 'script.json', path: 'lines[0].pose', message: '"dance" inválido' }],
    warnings: [{ message: 'imagem ausente' }],
  };
  const report = await service.save(FOLDER, SCRIPT);
  assert.deepEqual(disk.writes, [`${FOLDER}/script.json`]);
  assert.deepEqual(report, {
    errors: [{ line: 1, field: null, message: '2 trecho(s) [..] mas 1 beat(s)' }, { line: 0, field: 'pose', message: '"dance" inválido' }],
    warnings: [{ line: null, field: null, message: 'imagem ausente' }],
    stages: STAGES,
  });
});

test('a folder never given to the Studio is neither read nor written', async () => {
  const { service, disk } = setup();
  await assert.rejects(service.save('/home/ana/.ssh', SCRIPT), { code: 'invalid-request' });
  await assert.rejects(service.read('/etc'), { code: 'invalid-request' });
  assert.deepEqual(disk.writes, []);
});

test('problems are placed by line id, by path inside a line, or on the whole project', () => {
  assert.deepEqual(editorProblemOf({ file: 'script.json', path: 'lines[3].beats[0].pose', message: 'inválido' }, SCRIPT), { line: 3, field: 'beats', message: '[0].pose: inválido' });
  assert.deepEqual(editorProblemOf({ file: 'script.json', path: 'lines[1]', message: 'campo desconhecido' }, SCRIPT), { line: 1, field: null, message: 'campo desconhecido' });
  assert.deepEqual(editorProblemOf({ file: 'script.json', path: 'chapters', message: 'vazio' }, SCRIPT), { line: null, field: null, message: 'script.json › chapters: vazio' });
  assert.deepEqual(editorProblemOf({ file: 'cast/bia.json', path: 'parameters.skin', message: '"roxo" inválido' }, SCRIPT), { line: null, field: null, message: 'cast/bia.json › parameters.skin: "roxo" inválido' });
  assert.deepEqual(editorProblemOf({ lineId: '99', message: 'sumiu' }, SCRIPT), { line: null, field: null, message: '99: sumiu' });
});

test('the scene check and the vocabulary come from core', async () => {
  const { service } = setup();
  assert.deepEqual(await service.checkScene({ type: 'talk' }), []);
  assert.deepEqual((await service.vocabulary()).poses, ['neutral']);
});
