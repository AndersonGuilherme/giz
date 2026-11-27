import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderGrants } from '../../../../src/main/services/FolderGrants.ts';
import { ScenarioService } from '../../../../src/main/services/media/ScenarioService.ts';
import type { ImageProgress } from '../../../../src/shared/scenarios.ts';
import { FakeMediaCore, MemoryMediaFiles } from '../../../doubles/mediaFakes.ts';
import { MemoryDisk } from '../../../doubles/scriptFakes.ts';

const FOLDER = '/projects/cats';
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const scene = (background: object) => ({ type: 'scenario', background, characters: [{ character: 'ana', position: 'center' }] });

function build(options: Readonly<{ key?: string; needsKey?: boolean }> = {}) {
  const disk = new MemoryDisk();
  disk.put(FOLDER, 'project.json', { version: 2, aspect: '9:16', cast: ['ana'], voice: { provider: 'qwen' } });
  disk.put(FOLDER, 'script.json', { chapters: ['A'], lines: [
    { id: '1', chapter: 1, speaker: 'ana', text: 'Na praça.', scene: scene({ vector: 'street' }) },
    { id: '2', chapter: 1, speaker: 'ana', text: 'Ainda na praça.' },
    { id: '3', chapter: 1, speaker: 'ana', text: 'No laboratório.', scene: scene({ vector: 'lab', generate: { prompt: 'um laboratório', style: 'chalk' }, image: 'scenes/3.png' }) },
    { id: '4', chapter: 1, speaker: 'ana', text: 'Um título.', scene: { type: 'title', title: 'Oi' } },
  ] });
  const grants = new FolderGrants();
  grants.grant('/projects');
  const core = new FakeMediaCore();
  const files = new MemoryMediaFiles();
  const progress: ImageProgress[] = [];
  const keys: string[] = [];
  const service = new ScenarioService({
    core, disk, files, grants, vectors: async () => ['street', 'lab', 'room'], provider: async () => 'gemini',
    keyOf: async (name) => (keys.push(name), options.key), needsKey: options.needsKey ?? true, progress: (step) => progress.push(step),
  });
  return { disk, core, files, service, progress, keys };
}

const lineOf = async (disk: MemoryDisk, id: string) => ((await disk.readJson(FOLDER, 'script.json')) as { lines: Array<{ id: string; scene: { background: Record<string, unknown> } }> }).lines.find((line) => line.id === id)!;

test('one card per scenario scene: its background, the prompt, the image giz made and its state from the stages', async () => {
  const { service, core, files } = build();
  await files.write(FOLDER, 'scenes/3.png', PNG);
  core.items_ = { ...core.items_, scenarios: { stale: ['3'], missing: [], blocked: [], problems: [] } };
  const document = await service.read(FOLDER);
  assert.deepEqual(document.cards.map(({ lineId, number }) => [lineId, number]), [['1', 1], ['3', 3]]);
  assert.deepEqual(document.cards[0]!.background, { kind: 'vector', vector: 'street', colors: {} });
  const lab = document.cards[1]!;
  assert.equal(lab.background.kind === 'image' && lab.background.own, false);
  assert.deepEqual([lab.generate, lab.state], [{ prompt: 'um laboratório', style: 'chalk' }, 'stale']);
  assert.match(lab.generated!, /^giz-media:\/\/file\/%2Fprojects%2Fcats%2Fscenes%2F3\.png\?v=/);
  assert.equal(document.provider, 'gemini');
});

test('a vector background replaces the image and the prompt; an unknown vector is refused', async () => {
  const { service, disk } = build();
  await service.vector(FOLDER, '3', 'room');
  assert.deepEqual((await lineOf(disk, '3')).scene.background, { vector: 'room' });
  await assert.rejects(service.vector(FOLDER, '3', 'mars'), { code: 'invalid-request' });
  await assert.rejects(service.vector(FOLDER, '2', 'room'), /não tem uma cena de cenário/);
});

test('upload: checked by its first bytes, copied as scenes/<id>-own.<ext>; it wins (own), with the shape warning', async () => {
  const { service, disk, files } = build();
  const document = await service.upload(FOLDER, '1', PNG);
  assert.ok(files.files.has(`${FOLDER}/scenes/1-own.png`));
  assert.equal((await lineOf(disk, '1')).scene.background.image, 'scenes/1-own.png');
  const card = document.cards[0]!;
  assert.ok(card.background.kind === 'image' && card.background.own);
  assert.match(card.background.kind === 'image' ? card.background.aspectWarning ?? '' : '', /800×800, outra proporção/);
  await assert.rejects(service.upload(FOLDER, '1', new TextEncoder().encode('<html>')), /não é uma imagem/);
  await assert.rejects(service.upload(FOLDER, '9', PNG), { code: 'invalid-request' });
});

test('"usar a gerada": back to scenes/<id>.png when giz made it, otherwise no image (so the image AI makes it)', async () => {
  const { service, disk, files } = build();
  await service.upload(FOLDER, '3', PNG);
  await service.useGenerated(FOLDER, '3');
  assert.equal((await lineOf(disk, '3')).scene.background.image, undefined);
  await files.write(FOLDER, 'scenes/3.png', PNG);
  await service.upload(FOLDER, '3', PNG);
  await service.useGenerated(FOLDER, '3');
  assert.equal((await lineOf(disk, '3')).scene.background.image, 'scenes/3.png');
});

test('prompt and style are saved in background.generate, keeping the rest', async () => {
  const { service, disk } = build();
  await service.prompt(FOLDER, '1', { prompt: '  uma praça ao entardecer ', style: 'watercolor' });
  assert.deepEqual((await lineOf(disk, '1')).scene.background, { vector: 'street', generate: { prompt: 'uma praça ao entardecer', style: 'watercolor' } });
});

test('generate: the key is read in main, the project keeps the image AI, progress is told; no key is refused before any call', async () => {
  const { service, core, disk, progress, keys } = build({ key: 'k' });
  await service.generate(FOLDER, '3', true);
  assert.deepEqual(keys, ['gemini']);
  assert.deepEqual(core.imageJobs.map(({ lineId, force, provider, key }) => ({ lineId, force, provider, key })), [{ lineId: '3', force: true, provider: 'gemini', key: 'k' }]);
  assert.equal(((await disk.readJson(FOLDER, 'project.json')) as { imageProvider: string }).imageProvider, 'gemini');
  assert.deepEqual(progress, [{ lineId: '3', phase: 'calling' }, { lineId: '3', phase: 'done' }]);
  const without = build();
  await assert.rejects(without.service.generate(FOLDER, '3', false), /Falta a chave de gemini/);
  assert.equal(without.core.imageJobs.length, 0);
});

test('one image at a time; cancel answers cancelled at once', async () => {
  const { service, core } = build({ needsKey: false });
  let release: () => void = () => undefined;
  core.during = () => new Promise((done) => (release = done));
  const first = service.generate(FOLDER, '3', false);
  await new Promise((done) => setTimeout(done, 5));
  await assert.rejects(service.generate(FOLDER, '1', false), { code: 'busy' });
  assert.equal(service.cancel(), true);
  await assert.rejects(first, { code: 'cancelled' });
  release();
  assert.equal(service.cancel(), false);
});

test('the estimate names the project image AI (or the Settings one) and its model', async () => {
  const { service, disk } = build();
  assert.deepEqual(await service.estimate(FOLDER, '3', false), { provider: 'gemini', model: 'gemini-model', pending: 1, dollars: 0.08 });
  await service.settings(FOLDER, { provider: 'fal', style: 'chalk' });
  const project = (await disk.readJson(FOLDER, 'project.json')) as { imageProvider: string; style: string };
  assert.deepEqual([project.imageProvider, project.style], ['fal', 'chalk']);
  assert.equal((await service.estimate(FOLDER, '3', false)).provider, 'fal');
});
