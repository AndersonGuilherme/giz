import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderGrants } from '../../../../src/main/services/FolderGrants.ts';
import { FolderQueue } from '../../../../src/main/services/FolderQueue.ts';
import type { ImageJob } from '../../../../src/main/ports/MediaCore.ts';
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
  const saves = new FolderQueue();
  const service = new ScenarioService({
    core, disk, files, grants, saves, vectors: async () => ['street', 'lab', 'room'], provider: async () => 'gemini',
    keyOf: async (name) => (keys.push(name), options.key), needsKey: options.needsKey ?? true, progress: (step) => progress.push(step),
  });
  return { disk, core, files, service, progress, keys, saves };
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

test('a vector background replaces the image and stops using the prompt, which is kept for later; an unknown vector is refused', async () => {
  const { service, disk } = build();
  const document = await service.vector(FOLDER, '3', 'room');
  assert.deepEqual((await lineOf(disk, '3')).scene.background, { vector: 'room' }, 'the image AI no longer makes this scene');
  const card = document.cards.find(({ lineId }) => lineId === '3')!;
  assert.deepEqual([card.generate, card.keptPrompt], [undefined, { prompt: 'um laboratório', style: 'chalk' }]);
  assert.deepEqual((await service.read(FOLDER)).cards[1]!.keptPrompt, { prompt: 'um laboratório', style: 'chalk' }, 'kept on disk');
  await service.vector(FOLDER, '3', 'street');
  assert.deepEqual((await service.read(FOLDER)).cards[1]!.keptPrompt, { prompt: 'um laboratório', style: 'chalk' }, 'a second vector keeps it too');
  await assert.rejects(service.vector(FOLDER, '3', 'mars'), { code: 'invalid-request' });
  await assert.rejects(service.vector(FOLDER, '2', 'room'), /não tem uma cena de cenário/);
});

test('upload: checked by its first bytes, copied as scenes/own/<id>.<ext>; it wins (own), with the shape warning', async () => {
  const { service, disk, files } = build();
  const document = await service.upload(FOLDER, '1', PNG);
  assert.ok(files.files.has(`${FOLDER}/scenes/own/1.png`));
  assert.equal((await lineOf(disk, '1')).scene.background.image, 'scenes/own/1.png');
  const card = document.cards[0]!;
  assert.ok(card.background.kind === 'image' && card.background.own);
  assert.match(card.background.kind === 'image' ? card.background.aspectWarning ?? '' : '', /800×800, outra proporção/);
  await assert.rejects(service.upload(FOLDER, '1', new TextEncoder().encode('<html>')), /não é uma imagem/);
  await assert.rejects(service.upload(FOLDER, '9', PNG), { code: 'invalid-request' });
});

test('an upload in another format replaces the old own picture: no scenes/own/<id>.* of the line is left behind', async () => {
  const { service, disk, files } = build();
  await service.upload(FOLDER, '1', PNG);
  await files.write(FOLDER, 'scenes/own/12.png', PNG);
  await service.upload(FOLDER, '1', new Uint8Array([0xff, 0xd8, 0xff]));
  assert.equal(files.files.has(`${FOLDER}/scenes/own/1.png`), false);
  assert.ok(files.files.has(`${FOLDER}/scenes/own/1.jpg`));
  assert.ok(files.files.has(`${FOLDER}/scenes/own/12.png`), 'another line keeps its own');
  assert.equal((await lineOf(disk, '1')).scene.background.image, 'scenes/own/1.jpg');
});

test('crop: the chosen part of the picture is kept in background.crop (never the file); null shows all of it; a new upload starts uncropped', async () => {
  const { service, disk, files } = build();
  await service.upload(FOLDER, '1', PNG);
  const document = await service.crop(FOLDER, '1', { zoom: 1.5, x: 0.2, y: 0.6 });
  assert.deepEqual((await lineOf(disk, '1')).scene.background.crop, { zoom: 1.5, x: 0.2, y: 0.6 });
  const card = document.cards[0]!;
  assert.deepEqual(card.background.kind === 'image' && card.background.crop, { zoom: 1.5, x: 0.2, y: 0.6 });
  assert.deepEqual(files.files.get(`${FOLDER}/scenes/own/1.png`), PNG);
  await service.crop(FOLDER, '1', null);
  assert.equal('crop' in (await lineOf(disk, '1')).scene.background, false);
  await service.crop(FOLDER, '1', { zoom: 2, x: 0, y: 0 });
  await service.upload(FOLDER, '1', PNG);
  assert.equal('crop' in (await lineOf(disk, '1')).scene.background, false);
  await service.vector(FOLDER, '1', 'street');
  await assert.rejects(service.crop(FOLDER, '1', { zoom: 2, x: 0, y: 0 }), /tem imagem/);
});

test('"usar a gerada" drops the crop of the own picture (it framed another picture), in both cases', async () => {
  const { service, disk, files } = build();
  await service.upload(FOLDER, '3', PNG);
  await service.crop(FOLDER, '3', { zoom: 2, x: 0.1, y: 0.9 });
  await service.useGenerated(FOLDER, '3');
  assert.equal('crop' in (await lineOf(disk, '3')).scene.background, false);
  await service.upload(FOLDER, '1', PNG);
  await service.crop(FOLDER, '1', { zoom: 2, x: 0.1, y: 0.9 });
  await files.remove(FOLDER, 'scenes/1.png');
  await service.useGenerated(FOLDER, '1');
  assert.deepEqual(Object.keys((await lineOf(disk, '1')).scene.background).sort(), ['vector']);
});

test('a framed picture of another shape says it was framed by the person, not that its edges are cut', async () => {
  const { service } = build();
  await service.upload(FOLDER, '1', PNG);
  const document = await service.crop(FOLDER, '1', { zoom: 1.4, x: 0.5, y: 0.5 });
  const background = document.cards[0]!.background;
  assert.match(background.kind === 'image' ? background.aspectWarning ?? '' : '', /800×800, enquadrada por você/);
});

test('upload to a line without its own scenario scene is refused before anything is written', async () => {
  const { service, files } = build();
  await assert.rejects(service.upload(FOLDER, '2', PNG), /não tem uma cena de cenário/);
  await assert.rejects(service.upload(FOLDER, '4', PNG), /não tem uma cena de cenário/);
  assert.deepEqual([...files.files.keys()], []);
});

test("the scenario writes wait for the folder's other writes (one queue with the script editor)", async () => {
  const { service, disk, saves } = build();
  let release: () => void = () => undefined;
  const held = saves.run(FOLDER, () => new Promise<void>((done) => (release = done)));
  const writes = [service.vector(FOLDER, '1', 'lab'), service.prompt(FOLDER, '3', { prompt: 'outro' }), service.settings(FOLDER, { style: 'chalk' })];
  await new Promise((done) => setTimeout(done, 5));
  assert.equal(disk.writes.length, 0);
  release();
  await held;
  await Promise.all(writes);
  assert.equal((await lineOf(disk, '1')).scene.background.vector, 'lab');
  assert.equal(((await lineOf(disk, '3')).scene.background.generate as { prompt: string }).prompt, 'outro', 'each write saw the one before it');
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

test("generate: core's link of the made image (script.json) is written in the folder's queue, after the editor's save in flight", async () => {
  const { service, core, saves } = build({ key: 'k' });
  const order: string[] = [];
  core.during = async (job) => {
    let release: () => void = () => undefined;
    const editorSave = saves.run(FOLDER, () => new Promise<void>((done) => (release = () => (order.push('editor'), done()))));
    const link = (job as ImageJob).queued!(async () => void order.push('link'));
    await new Promise((done) => setImmediate(done));
    assert.deepEqual(order, []);
    release();
    await Promise.all([editorSave, link]);
  };
  await service.generate(FOLDER, '3', false);
  assert.deepEqual(order, ['editor', 'link']);
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
  await assert.rejects(service.generate(FOLDER, '1', false), { code: 'busy' }, 'busy until the call in flight really ends');
  release();
  await new Promise((done) => setTimeout(done, 5));
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
