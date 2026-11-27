import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProjectService } from '../../../src/main/services/ProjectService.ts';
import { FakeCore, fakeProject } from '../../doubles/fakes.ts';

const picker = (folder: string | null) => ({ pickFolder: async () => folder });

test('open returns a plain, serializable summary of the project', async () => {
  const service = new ProjectService({ core: new FakeCore(fakeProject()), picker: picker(null), launchFolder: null });
  const summary = await service.open('/projetos/cupom');
  const expected = {
    folder: '/projetos/cupom', title: 'O cupom', format: 'lesson', language: 'pt-BR', aspect: '16:9',
    cast: ['lia', 'teo'], chapters: 2, lines: 12, warnings: ['imagem ausente'],
  };
  assert.deepEqual(summary, expected);
  assert.deepEqual(JSON.parse(JSON.stringify(summary)), expected);
});

test("check loads the folder and returns core's report as plain data", async () => {
  const report = { errors: [{ line: 'l1', message: 'texto não cabe' }], warnings: [] };
  const core = new FakeCore(fakeProject(), report);
  const service = new ProjectService({ core, picker: picker(null), launchFolder: null });
  assert.deepEqual(await service.check('/p'), report);
  assert.deepEqual(core.loads, ['/p']);
});

test('pick asks the folder picker; launched gives the command-line folder', async () => {
  const service = new ProjectService({ core: new FakeCore(fakeProject()), picker: picker('/escolhida'), launchFolder: '/linha' });
  assert.equal(await service.pick(), '/escolhida');
  assert.equal(service.launched(), '/linha');
});
