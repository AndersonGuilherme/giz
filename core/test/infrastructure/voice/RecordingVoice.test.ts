import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { VoiceRequest } from '../../../src/application/ports/VoiceProvider.ts';
import { Audio } from '../../../src/domain/speech/Audio.ts';
import { Language } from '../../../src/domain/values/Language.ts';
import { RecordingVoice } from '../../../src/infrastructure/voice/RecordingVoice.ts';
import { toWav } from '../../../src/infrastructure/voice/wav.ts';

const folder = await mkdtemp(join(tmpdir(), 'gizzy-recordings-'));
after(() => rm(folder, { recursive: true, force: true }));
const request = (lineId: string): VoiceRequest => ({ lineId, text: 'Oi', voice: 'eu', language: Language.PORTUGUESE });

test('RecordingVoice without the recording says where it should be', async () => {
  await assert.rejects(new RecordingVoice(folder).generate(request('7')), /recordings\/7\.wav/);
});

test('RecordingVoice reads the line recording', async () => {
  await mkdir(join(folder, 'recordings'), { recursive: true });
  await writeFile(join(folder, 'recordings', '3.wav'), toWav(Audio.of(new Float32Array(12000), 24000)));
  const audio = await new RecordingVoice(folder).generate(request('3'));
  assert.equal(audio.duration().value(), 0.5);
});

test('the fingerprint is the content of the recording: a new take changes it, a missing one has none', async () => {
  const voice = new RecordingVoice(folder);
  await mkdir(join(folder, 'recordings'), { recursive: true });
  await writeFile(join(folder, 'recordings', '5.wav'), toWav(Audio.of(new Float32Array(2400), 24000)));
  const first = await voice.fingerprint(request('5'));
  assert.match(first, /^[0-9a-f]{40}$/);
  assert.equal(await voice.fingerprint(request('5')), first);
  await writeFile(join(folder, 'recordings', '5.wav'), toWav(Audio.of(new Float32Array(4800), 24000)));
  assert.notEqual(await voice.fingerprint(request('5')), first);
  assert.equal(await voice.fingerprint(request('404')), '');
});
