import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BuildService } from '../../../../src/main/services/video/BuildService.ts';
import { grantsFor } from '../../../doubles/fakes.ts';
import { FakeVideoCore, NO_ITEMS } from '../../../doubles/videoFakes.ts';

const setup = () => {
  const core = new FakeVideoCore();
  const grants = grantsFor('/p');
  const served: string[] = [];
  return { core, grants, served, service: new BuildService({ core, grants, serve: (folder) => void served.push(folder) }) };
};

test("without an aspect, the montage is in the project's own; core's sounds and fonts folders are served, never granted", async () => {
  const { core, grants, served, service } = setup();
  const montage = await service.montage('/p');
  assert.equal(montage.aspect, '16:9');
  assert.deepEqual(core.built, ['16:9']);
  assert.equal(montage.failure, null);
  assert.equal(montage.build?.seconds, 62.5);
  assert.deepEqual(served, ['/core/public/sounds', '/core/public/fonts']);
  assert.equal(grants.allows('/core/public/sounds/pop.wav'), false);
  assert.equal(grants.allows('/core/public/fonts/Nunito.ttf'), false);
});

test('the other aspect is montaged and checked in that aspect', async () => {
  const { core, service } = setup();
  core.checks['9:16'] = { errors: [{ line: 'a2', message: 'o texto sai da área segura' }], warnings: [] };
  const montage = await service.montage('/p', '9:16');
  assert.deepEqual([montage.aspect, core.inspected, core.built], ['9:16', ['9:16'], ['9:16']]);
  assert.equal(montage.inspection.check.errors.length, 1);
});

test('a line without voice: nothing is montaged, and the failure names the lines by number', async () => {
  const { core, service } = setup();
  core.items_ = { ...NO_ITEMS, voices: { stale: [], missing: ['a2', 'a3'] } };
  const montage = await service.montage('/p');
  assert.equal(montage.build, null);
  assert.deepEqual(core.built, []);
  assert.deepEqual(montage.failure?.voices, ['a2', 'a3']);
  assert.match(montage.failure?.message ?? '', /Faltam as vozes de 2 falas: 2, 3/);
});

test("core's montage error becomes a readable failure, its text in the details", async () => {
  const { core, service } = setup();
  core.buildError = new Error('cena da fala 2: imagem ausente');
  const montage = await service.montage('/p');
  assert.deepEqual([montage.build, montage.failure?.message, montage.failure?.details], [null, 'O vídeo não pôde ser montado.', ['cena da fala 2: imagem ausente']]);
});

test('ready (for the render) refuses missing voices and check errors in that aspect, with each problem on its line', async () => {
  const { core, service } = setup();
  core.checks['9:16'] = { errors: [{ line: 'a2', message: 'texto grande demais' }, { line: '', message: 'sem título' }], warnings: [] };
  await assert.rejects(service.ready('/p', '9:16'), { code: 'invalid-project', details: ['fala 2: texto grande demais', 'sem título'] });
  assert.equal((await service.ready('/p', '16:9')).build.seconds, 62.5);
  core.items_ = { ...NO_ITEMS, voices: { stale: [], missing: ['a1'] } };
  await assert.rejects(service.ready('/p', '16:9'), { code: 'invalid-project', message: /de 1 fala: 1/ });
});

test('a folder the person did not give is refused before core sees it', async () => {
  const { core, service } = setup();
  await assert.rejects(service.montage('/etc'), { code: 'invalid-request' });
  assert.deepEqual(core.inspected, []);
});
