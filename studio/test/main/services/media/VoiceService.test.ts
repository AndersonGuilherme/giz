import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderGrants } from '../../../../src/main/services/FolderGrants.ts';
import { VoiceService } from '../../../../src/main/services/media/VoiceService.ts';
import type { VoiceProgress } from '../../../../src/shared/voices.ts';
import { FakeMediaCore, MemoryMediaFiles } from '../../../doubles/mediaFakes.ts';
import { MemoryDisk } from '../../../doubles/scriptFakes.ts';

const FOLDER = '/projects/cats';
const WAV = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69]);

function build(provider = 'qwen', key?: string) {
  const disk = new MemoryDisk();
  disk.put(FOLDER, 'project.json', { version: 2, aspect: '9:16', cast: ['ana', 'narrator'], voice: { provider } });
  disk.put(FOLDER, 'cast/ana.json', { id: 'ana', name: 'Ana', rig: 'giz', voice: { id: 'vivian' } });
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
  const service = new VoiceService({ core, disk, files, grants, keyOf: async () => key, needsKey: true, progress: (step) => progress.push(step) });
  return { disk, core, files, service, progress };
}

test('every line with its speaker, its state (done, stale, missing), its audio and whether it is the person\'s own take', async () => {
  const { service, files } = build();
  await files.write(FOLDER, 'voice/1.wav', WAV);
  await files.write(FOLDER, 'recordings/1.wav', WAV);
  const document = await service.read(FOLDER);
  assert.deepEqual(document.lines.map(({ lineId, speakerName, state, recorded }) => [lineId, speakerName, state, recorded]), [
    ['1', 'Ana', 'done', true], ['2', 'narrator', 'stale', false], ['3', 'Ana', 'missing', false],
  ]);
  assert.match(document.lines[0]!.audio!, /^giz-media:\/\/file\/%2Fprojects%2Fcats%2Fvoice%2F1\.wav\?v=/);
  assert.equal(document.lines[1]!.audio, null);
  assert.deepEqual([document.pending, document.dollars, document.provider], [2, 0.004, 'qwen']);
});

test('"gerar todas as pendentes" makes every pending line; one line alone is made again; progress is told', async () => {
  const { service, core, progress } = build();
  await service.generate(FOLDER);
  await service.generate(FOLDER, '2');
  assert.deepEqual(core.voiceJobs.map(({ only }) => only), [undefined, '2']);
  assert.deepEqual(progress.at(-1), { done: 1, total: 1, lineId: '2' });
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
