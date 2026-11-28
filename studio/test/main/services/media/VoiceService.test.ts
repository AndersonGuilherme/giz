import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderGrants } from '../../../../src/main/services/FolderGrants.ts';
import { FolderQueue } from '../../../../src/main/services/FolderQueue.ts';
import { VoiceService } from '../../../../src/main/services/media/VoiceService.ts';
import type { VoiceProgress } from '../../../../src/shared/voices.ts';
import { FakeMediaCore, MemoryMediaFiles } from '../../../doubles/mediaFakes.ts';
import { MemoryDisk } from '../../../doubles/scriptFakes.ts';

const FOLDER = '/projects/cats';
const WAV = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69]);

function build(provider = 'qwen', key?: string, ready = true) {
  const disk = new MemoryDisk();
  disk.put(FOLDER, 'project.json', { version: 2, aspect: '9:16', cast: ['ana', 'narrator'], voice: { provider } });
  disk.put(FOLDER, 'cast/ana.json', { id: 'ana', name: 'Ana', rig: 'gizzy', voice: { id: 'vivian' } });
  disk.put(FOLDER, 'script.json', { chapters: ['A'], lines: [
    { id: '1', chapter: 1, speaker: 'ana', text: 'Oi.' },
    { id: '2', chapter: 1, speaker: 'narrator', text: 'Era uma vez.' },
    { id: '3', chapter: 1, speaker: 'ana', text: 'Tchau.' },
  ] });
  const grants = new FolderGrants();
  grants.grant('/projects');
  const core = new FakeMediaCore();
  core.items_ = { ...core.items_, voices: { stale: ['2'], missing: ['3'] }, voiceDollars: 0.004 };
  const files = new MemoryMediaFiles();
  const progress: VoiceProgress[] = [];
  const saves = new FolderQueue();
  const asked: Array<string | undefined> = [];
  const localVoiceReady = async (model?: string) => (asked.push(model), ready);
  const service = new VoiceService({ core, disk, files, grants, saves, keyOf: async () => key, needsKey: true, localVoiceReady, progress: (step) => progress.push(step) });
  return { disk, core, files, service, progress, saves, asked };
}

test('every line with its speaker, its state (done, stale, missing), its audio and whether it is the person\'s own take', async () => {
  const { service, files } = build();
  await files.write(FOLDER, 'voice/1.wav', WAV);
  await files.write(FOLDER, 'recordings/1.wav', WAV);
  const document = await service.read(FOLDER);
  assert.deepEqual(document.lines.map(({ lineId, speakerName, state, recorded }) => [lineId, speakerName, state, recorded]), [
    ['1', 'Ana', 'done', true], ['2', 'narrator', 'stale', false], ['3', 'Ana', 'missing', false],
  ]);
  assert.match(document.lines[0]!.audio!, /^gizzy-media:\/\/file\/%2Fprojects%2Fcats%2Fvoice%2F1\.wav\?v=/);
  assert.equal(document.lines[1]!.audio, null);
  assert.deepEqual([document.pending, document.dollars, document.provider], [2, 0.004, 'qwen']);
});

test('"gerar todas as pendentes" makes every pending line; one line alone is made again; progress is told', async () => {
  const { service, core, progress } = build();
  await service.generate(FOLDER);
  await service.generate(FOLDER, '2');
  assert.deepEqual(core.voiceJobs.map(({ only }) => only), [undefined, '2']);
  assert.deepEqual(progress.slice(-2), [{ done: 1, total: 1, lineId: '2' }, { done: 1, total: 1, lineId: '2', ended: true }]);
  await assert.rejects(service.generate(FOLDER, '9'), { code: 'invalid-request' });
});

test('a paid voice needs its key, read in main before anything is made', async () => {
  const without = build('elevenlabs');
  await assert.rejects(without.service.generate(FOLDER), /Falta a chave de elevenlabs/);
  assert.equal(without.core.voiceJobs.length, 0);
  const withKey = build('elevenlabs', 'k');
  await withKey.service.generate(FOLDER);
  assert.equal(withKey.core.voiceJobs[0]!.key, 'k');
});

test('cancel: the job answers cancelled; a second job while one runs is busy', async () => {
  const { service, core } = build();
  core.during = () => new Promise(() => undefined);
  const running = service.generate(FOLDER);
  await new Promise((done) => setTimeout(done, 5));
  await assert.rejects(service.generate(FOLDER, '1'), { code: 'busy' });
  service.cancel();
  await assert.rejects(running, { code: 'cancelled' });
});

test('"gravar minha voz": a valid WAV becomes recordings/<id>.wav and the line is made from it; anything else is refused', async () => {
  const { service, core, files } = build();
  await service.record(FOLDER, '3', WAV);
  assert.ok(files.files.has(`${FOLDER}/recordings/3.wav`));
  assert.equal(core.voiceJobs[0]!.only, '3');
  core.wavProblem = 'o WAV precisa ser PCM de 16 bits';
  await assert.rejects(service.record(FOLDER, '1', new Uint8Array([1, 2, 3])), (error: Error & { code: string; details: string[] }) => error.code === 'invalid-request' && error.details[0] === 'o WAV precisa ser PCM de 16 bits');
  assert.equal(files.files.has(`${FOLDER}/recordings/1.wav`), false);
  await assert.rejects(service.record(FOLDER, '../x', WAV), { code: 'invalid-request' });
});

test('without its take the line goes back to the project voice (made again)', async () => {
  const { service, core, files } = build();
  await files.write(FOLDER, 'recordings/1.wav', WAV);
  await service.unrecord(FOLDER, '1');
  assert.equal(files.files.has(`${FOLDER}/recordings/1.wav`), false);
  assert.equal(core.voiceJobs[0]!.only, '1');
});

const later = (milliseconds = 5) => new Promise((done) => setTimeout(done, milliseconds));

test('while a job runs, a take is neither written nor removed (busy), and the document says a job is running', async () => {
  const { service, core, files } = build();
  await files.write(FOLDER, 'recordings/1.wav', WAV);
  let release: () => void = () => undefined;
  core.during = () => new Promise((done) => (release = done));
  const running = service.generate(FOLDER);
  await later();
  assert.equal((await service.read(FOLDER)).generating, true);
  await assert.rejects(service.record(FOLDER, '3', WAV), { code: 'busy' });
  await assert.rejects(service.unrecord(FOLDER, '1'), { code: 'busy' });
  assert.equal(files.files.has(`${FOLDER}/recordings/3.wav`), false);
  assert.equal(files.files.has(`${FOLDER}/recordings/1.wav`), true);
  release();
  await running;
  assert.equal((await service.read(FOLDER)).generating, false);
});

test('the end of a job is told (even after a cancel, once the line in flight really ends), so a screen opened later can reload', async () => {
  const { service, core, progress } = build();
  let release: () => void = () => undefined;
  core.during = () => new Promise((done) => (release = done));
  const running = service.generate(FOLDER);
  await later();
  service.cancel();
  await assert.rejects(running, { code: 'cancelled' });
  assert.equal(progress.some(({ ended }) => ended), false, 'not ended while the line is still being made');
  release();
  await later();
  assert.deepEqual(progress.at(-1), { done: 1, total: 1, lineId: '1', ended: true });
});

test("the take is written in the folder's queue (after the folder's other writes)", async () => {
  const { service, files, saves } = build();
  let release: () => void = () => undefined;
  const held = saves.run(FOLDER, () => new Promise<void>((done) => (release = done)));
  const recording = service.record(FOLDER, '3', WAV);
  await later();
  assert.equal(files.files.has(`${FOLDER}/recordings/3.wav`), false);
  release();
  await held;
  await recording;
  assert.equal(files.files.has(`${FOLDER}/recordings/3.wav`), true);
});

test('the local voice is never downloaded here: without its model, the lines it would make are refused with a way to Settings', async () => {
  const { service, core, files, asked, disk } = build('qwen', undefined, false);
  await assert.rejects(service.generate(FOLDER), { code: 'needs-setup', message: /Baixe o modelo de voz em Configurações/ });
  await assert.rejects(service.generate(FOLDER, '2'), { code: 'needs-setup' });
  assert.equal(core.voiceJobs.length, 0);
  assert.deepEqual(asked, [undefined, undefined], 'the project names no model: the configured one');
  await files.write(FOLDER, 'recordings/2.wav', WAV);
  await service.generate(FOLDER, '2');
  await service.record(FOLDER, '3', WAV);
  assert.deepEqual(core.voiceJobs.map(({ only }) => only), ['2', '3'], 'a line from the person\'s own take needs no model');
  await assert.rejects(service.unrecord(FOLDER, '3'), { code: 'needs-setup' }, 'without the take the line goes back to the local voice');
  disk.put(FOLDER, 'project.json', { version: 2, aspect: '9:16', cast: ['ana', 'narrator'], voice: { provider: 'qwen', model: '1.7b' } });
  await assert.rejects(service.generate(FOLDER, '1'), { code: 'needs-setup' });
  assert.equal(asked.at(-1), '1.7b');
  await service.generate(FOLDER);
  assert.equal(core.voiceJobs.length, 3, 'every pending line has a take: nothing needs the model');
});

test('a paid voice or a recording project never asks for the local model', async () => {
  const paid = build('elevenlabs', 'k', false);
  await paid.service.generate(FOLDER);
  assert.deepEqual(paid.asked, []);
  const recording = build('recording', undefined, false);
  await recording.service.generate(FOLDER);
  assert.deepEqual(recording.asked, []);
});
