import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProjectService } from '../../../src/main/services/ProjectService.ts';
import { FakeCore, fakeProject, grantsFor } from '../../doubles/fakes.ts';

const picker = (folder: string | null) => ({ pickFolder: async () => folder });

test('open returns a plain, serializable summary of the project', async () => {
  const service = new ProjectService({ core: new FakeCore(fakeProject()), picker: picker(null), grants: grantsFor('/projetos'), launchFolder: null });
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
  const service = new ProjectService({ core, picker: picker(null), grants: grantsFor('/p'), launchFolder: null });
  assert.deepEqual(await service.check('/p'), report);
  assert.deepEqual(core.loads, ['/p']);
});

test('a folder the person did not give is refused by open and check, and core never loads it', async () => {
  const core = new FakeCore(fakeProject());
  const service = new ProjectService({ core, picker: picker(null), grants: grantsFor('/p'), launchFolder: null });
  await assert.rejects(service.open('/home/someone/.ssh'), { code: 'invalid-request' });
  await assert.rejects(service.check('/p/../etc'), { code: 'invalid-request' });
  assert.deepEqual(core.loads, []);
});

test('the picked folder is granted; a cancelled pick grants nothing; launched gives the command-line folder', async () => {
  const grants = grantsFor();
  const service = new ProjectService({ core: new FakeCore(fakeProject()), picker: picker('/escolhida'), grants, launchFolder: '/linha' });
  assert.equal(await service.pick(), '/escolhida');
  assert.equal((await service.open('/escolhida')).folder, '/escolhida');
  assert.equal(service.launched(), '/linha');
  const cancelled = new ProjectService({ core: new FakeCore(fakeProject()), picker: picker(null), grants: grantsFor(), launchFolder: null });
  assert.equal(await cancelled.pick(), null);
});
