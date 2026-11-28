import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderGrants } from '../../../../src/main/services/FolderGrants.ts';
import { FolderQueue } from '../../../../src/main/services/FolderQueue.ts';
import { CastService } from '../../../../src/main/services/media/CastService.ts';
import { FakeMediaCore, MemoryMediaFiles } from '../../../doubles/mediaFakes.ts';
import { MemoryDisk } from '../../../doubles/scriptFakes.ts';

const FOLDER = '/projects/cats';
const ANA = { id: 'ana', name: 'Ana', rig: 'gizzy', parameters: { skin: 'light' }, voice: { id: 'vivian' }, defaultExpression: 'happy' };

function build(voicesBusy = () => false, ready = true) {
  const disk = new MemoryDisk();
  disk.put(FOLDER, 'project.json', { version: 2, title: 'Gatos', language: 'pt-BR', aspect: '9:16', cast: ['ana', 'narrator'], voice: { provider: 'qwen', model: '0.6b' } });
  disk.put(FOLDER, 'script.json', { chapters: ['Começo'], lines: [{ id: '1', chapter: 1, speaker: 'ana', text: 'Oi.' }, { id: '2', chapter: 1, speaker: 'ana', text: 'Tchau.' }] });
  disk.put(FOLDER, 'cast/ana.json', ANA);
  disk.put(FOLDER, 'cast/narrator.json', { id: 'narrator', name: 'Narrador', voice: { id: 'ryan' }, defaultExpression: 'neutral' });
  const grants = new FolderGrants();
  grants.grant('/projects');
  const core = new FakeMediaCore();
  const files = new MemoryMediaFiles();
  const keys: string[] = [];
  const saves = new FolderQueue();
  const service = new CastService({ core, disk, files, grants, saves, keyOf: async (name) => (keys.push(name), 'secret'), samples: '/user/samples', voicesBusy, localVoiceReady: async () => ready });
  return { disk, core, files, service, keys, saves };
}

test('read: every member with its file and how many lines it says; the narrator has no body; presets get the language style', async () => {
  const { service } = build();
  const document = await service.read(FOLDER);
  assert.deepEqual(document.members.map(({ file, lines }) => [file.id, file.rig ?? null, lines]), [['ana', 'gizzy', 2], ['narrator', null, 0]]);
  assert.deepEqual(document.voice, { provider: 'qwen', model: '0.6b' });
  assert.equal(document.presets[0]!.file.voice.style, 'Fale em português do Brasil');
});

test('save: core checks the file first; with a problem nothing is written', async () => {
  const { service, core, disk } = build();
  core.problems = [{ path: 'parameters.skin', message: 'opção "roxo" inválida' }];
  const refused = await service.save(FOLDER, { ...ANA, parameters: { skin: 'roxo' } });
  assert.equal(refused.saved, false);
  assert.equal(disk.writes.length, 0);
  core.problems = [];
  const saved = await service.save(FOLDER, { ...ANA, name: 'Ana Lu', personality: '  ', voice: { id: 'vivian', style: ' calma ' } });
  assert.equal(saved.saved, true);
  assert.deepEqual(await disk.readJson(FOLDER, 'cast/ana.json'), { id: 'ana', name: 'Ana Lu', rig: 'gizzy', parameters: { skin: 'light' }, voice: { id: 'vivian', style: 'calma' }, defaultExpression: 'happy' });
});

test('a character written before the rename (rig "giz") opens as gizzy, and its next save writes gizzy', async () => {
  const { service, disk } = build();
  disk.put(FOLDER, 'cast/ana.json', { ...ANA, rig: 'giz' });
  const ana = (await service.read(FOLDER)).members.find(({ file }) => file.id === 'ana')!.file;
  assert.equal(ana.rig, 'gizzy');
  await service.save(FOLDER, ana);
  assert.equal(((await disk.readJson(FOLDER, 'cast/ana.json')) as { rig: string }).rig, 'gizzy');
});

test('save refuses a character that is not in the project, and any folder the person did not give', async () => {
  const { service } = build();
  await assert.rejects(service.save(FOLDER, { ...ANA, id: 'zed' }), { code: 'invalid-request' });
  await assert.rejects(service.read('/etc'), { code: 'invalid-request' });
});

test('add a preset (its file copied, with the style) or a new one (gizzy rig, first voice); the same id twice is refused', async () => {
  const { service, disk } = build();
  const withBia = await service.add(FOLDER, { preset: 'bia' });
  assert.deepEqual(withBia.members.map(({ file }) => file.id), ['ana', 'narrator', 'bia']);
  assert.equal(((await disk.readJson(FOLDER, 'cast/bia.json')) as { voice: { style: string } }).voice.style, 'Fale em português do Brasil');
  const withRui = await service.add(FOLDER, { id: 'Rui', name: 'Prof. Rui' });
  const rui = withRui.members.find(({ file }) => file.id === 'rui')!.file;
  assert.deepEqual([rui.name, rui.rig, rui.voice.id], ['Prof. Rui', 'gizzy', 'vivian']);
  await assert.rejects(service.add(FOLDER, { preset: 'bia' }), { code: 'invalid-request' });
  await assert.rejects(service.add(FOLDER, { id: '../x' }), { code: 'invalid-request' });
});

test('remove: refused while a line says the character; otherwise only project.json forgets it', async () => {
  const { service, disk } = build();
  await assert.rejects(service.remove(FOLDER, 'ana'), /ainda diz 2 fala/);
  const document = await service.remove(FOLDER, 'narrator');
  assert.deepEqual(document.members.map(({ file }) => file.id), ['ana']);
  assert.ok(await disk.exists(`${FOLDER}/cast/narrator.json`));
  await assert.rejects(service.remove(FOLDER, 'ana'), { code: 'invalid-request' });
});

test('the project voice: provider and model (the model only for the local voice)', async () => {
  const { service, disk } = build();
  await service.voice(FOLDER, { provider: 'elevenlabs', model: '1.7b' });
  assert.deepEqual(((await disk.readJson(FOLDER, 'project.json')) as { voice: unknown }).voice, { provider: 'elevenlabs' });
});

test('a sample: said with the project voice, kept and served from the samples folder; the same one again calls nothing', async () => {
  const { service, core, files } = build();
  const sample = await service.sample(FOLDER, { id: 'vivian', style: 'calma' }, 'Olá!');
  assert.match(sample.audio, /^gizzy-media:\/\/file\/%2Fuser%2Fsamples%2F[0-9a-f]{40}\.wav\?v=\d+$/);
  assert.deepEqual([sample.seconds, sample.visemes], [1.5, 'XA']);
  assert.deepEqual(core.samples[0]!.voice, { provider: 'qwen', model: '0.6b' });
  await service.sample(FOLDER, { id: 'vivian', style: 'calma' }, 'Olá!');
  assert.equal(core.samples.length, 1);
  assert.equal(files.files.size, 2);
});

test('a paid voice sample reads its key in main; a recording project has no sample', async () => {
  const { service, core, keys, disk } = build();
  await service.voice(FOLDER, { provider: 'fish' });
  await service.sample(FOLDER, { id: 'abc123' }, 'Olá!');
  assert.deepEqual(keys, ['fish']);
  assert.deepEqual(core.samples[0]!.voice, { provider: 'fish', key: 'secret' });
  await disk.writeJson(FOLDER, 'project.json', { ...((await disk.readJson(FOLDER, 'project.json')) as object), voice: { provider: 'recording' } });
  await assert.rejects(service.sample(FOLDER, { id: 'x' }, 'Olá!'), { code: 'unavailable' });
});

test("every cast write waits for the folder's other writes (one queue with the script editor and the other stages)", async () => {
  const { service, disk, saves } = build();
  let release: () => void = () => undefined;
  const held = saves.run(FOLDER, () => new Promise<void>((done) => (release = done)));
  const writes = [service.save(FOLDER, { ...ANA, name: 'Ana Maria' }), service.voice(FOLDER, { provider: 'fish' }), service.add(FOLDER, { preset: 'bia' })];
  await new Promise((done) => setTimeout(done, 5));
  assert.equal(disk.writes.length, 0, 'nothing is written while another write of the folder runs');
  release();
  await held;
  await Promise.all(writes);
  const project = (await disk.readJson(FOLDER, 'project.json')) as { cast: string[]; voice: { provider: string } };
  assert.deepEqual([project.voice.provider, project.cast], ['fish', ['ana', 'narrator', 'bia']], 'each write saw the one before it');
  await service.remove(FOLDER, 'bia');
  assert.deepEqual(((await disk.readJson(FOLDER, 'project.json')) as { cast: string[] }).cast, ['ana', 'narrator']);
});

test('read tells whether the voices are being made now (a sample asked then waits for the voice job)', async () => {
  let busy = false;
  const { service } = build(() => busy);
  assert.equal((await service.read('/projects/cats')).voicesGenerating, false);
  busy = true;
  assert.equal((await service.read('/projects/cats')).voicesGenerating, true);
});

test('a local voice sample without its model is refused with a way to Settings (never downloaded here)', async () => {
  const { service, core } = build(() => false, false);
  await assert.rejects(service.sample(FOLDER, { id: 'vivian' }, 'Olá!'), { code: 'needs-setup', message: /Baixe o modelo de voz em Configurações/ });
  assert.equal(core.samples.length, 0);
});
