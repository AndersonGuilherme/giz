import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { RecordedVoice } from '../../../src/application/ports/VoiceStore.ts';
import { Audio } from '../../../src/domain/speech/Audio.ts';
import { DiskVoiceStore } from '../../../src/infrastructure/disk/DiskVoiceStore.ts';
import { fromWav } from '../../../src/infrastructure/voice/wav.ts';

const folder = await mkdtemp(join(tmpdir(), 'gizzy-voices-'));
after(() => rm(folder, { recursive: true, force: true }));
const record: RecordedVoice = { file: 'voice/1.wav', hash: 'abc', durationSeconds: 0.5, envelope: [0, 1], visemes: 'XA' };

test('without a recording there is no hash', () => {
  assert.equal(new DiskVoiceStore(folder).savedHash('1'), undefined);
});

test('saves voice/<id>.wav and voice/<id>.json and reads them back', async () => {
  const store = new DiskVoiceStore(folder);
  await store.save('1', record, Audio.of(new Float32Array(12000), 24000));
  assert.deepEqual(await store.read('1'), record);
  assert.equal(store.savedHash('1'), 'abc');
  assert.equal(fromWav(await readFile(join(folder, 'voice', '1.wav'))).duration().value(), 0.5);
});

test('without the wav, the record does not count', async () => {
  const store = new DiskVoiceStore(folder);
  await store.save('2', record, Audio.of(new Float32Array(10), 24000));
  await rm(join(folder, 'voice', '2.wav'));
  assert.equal(store.savedHash('2'), undefined);
});

test('a saved line replaces its files whole (temp file, then rename) and leaves only its wav and json', { skip: process.platform === 'win32' }, async () => {
  const { chmod, mkdir, mkdtemp: fresh, readdir, writeFile } = await import('node:fs/promises');
  const project = await fresh(join(tmpdir(), 'gizzy-voices-'));
  await mkdir(join(project, 'voice'));
  await writeFile(join(project, 'voice', '7.wav'), 'old take');
  await chmod(join(project, 'voice', '7.wav'), 0o444);
  await new DiskVoiceStore(project).save('7', record, Audio.of(new Float32Array(10), 24000));
  assert.equal(fromWav(await readFile(join(project, 'voice', '7.wav'))).rate(), 24000);
  assert.deepEqual((await readdir(join(project, 'voice'))).sort(), ['7.json', '7.wav']);
  await rm(project, { recursive: true, force: true });
});
