import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  return { disk, core, service: new ScriptService({ core, disk, grants: grantsFor('/projetos') }) };
}

test('read gives the profile, the cast (who has a body) and the script; an id that is a path is never read', async () => {
  const { service } = setup();
  const document = await service.read(FOLDER);
  assert.deepEqual(document, {
    folder: FOLDER, title: 'Gatos', format: 'story', aspect: '9:16', language: 'pt-BR',
    cast: [{ id: 'bia', name: 'Bia', body: true }, { id: 'narrator', name: 'Narrador', body: false }], script: SCRIPT,
  });
});

test('a broken script.json opens as an empty script (the project.json is what is required)', async () => {
  const { service, disk } = setup();
  disk.files.set(`${FOLDER}/script.json`, '"nada"');
  assert.deepEqual((await service.read(FOLDER)).script, { chapters: [], lines: [] });
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
